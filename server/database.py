"""One durable SQLite workspace per demonstration. All source records are synthetic."""
import os
import sqlite3
from contextlib import contextmanager
from datetime import date, timedelta
from pathlib import Path
from threading import Lock
from uuid import UUID

from compatibility import ALL_GROUPS
from seed_donors import DEMO_DONORS

SCHEMA = """
CREATE TABLE IF NOT EXISTS hospital(id INTEGER PRIMARY KEY, name TEXT NOT NULL, autoInvite INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS donor(id INTEGER PRIMARY KEY, bloodGroup TEXT, distanceKm REAL,
    available INTEGER, responseRate REAL, lastActiveDays INTEGER, lastActiveLabel TEXT,
    nextEligible TEXT, components TEXT);
CREATE TABLE IF NOT EXISTS request(id TEXT PRIMARY KEY, token TEXT UNIQUE, hospital INTEGER REFERENCES hospital,
    bloodGroup TEXT, component TEXT, unitsNeeded INTEGER, urgency TEXT, radius INTEGER,
    created INTEGER, closed TEXT, source TEXT, reason TEXT);
CREATE TABLE IF NOT EXISTS invitation(requestId TEXT REFERENCES request, donorId INTEGER REFERENCES donor,
    status TEXT, score INTEGER, breakdown TEXT, similarity REAL, invited INTEGER, responded INTEGER, etaMinutes INTEGER,
    PRIMARY KEY(requestId, donorId));
CREATE TABLE IF NOT EXISTS activity(id INTEGER PRIMARY KEY, requestId TEXT, donorId INTEGER, event TEXT, at INTEGER);
CREATE TABLE IF NOT EXISTS stock(bloodGroup TEXT, component TEXT, available INTEGER,
    PRIMARY KEY(bloodGroup, component));
"""


DISPATCH_SCHEMA = """
CREATE TABLE IF NOT EXISTS dispatch(requestId TEXT PRIMARY KEY REFERENCES request, wave INTEGER NOT NULL,
    due INTEGER, escalated INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS decision(id INTEGER PRIMARY KEY, requestId TEXT REFERENCES request, wave INTEGER,
    at INTEGER, radius INTEGER, facts TEXT);
CREATE INDEX IF NOT EXISTS decision_request ON decision(requestId,id);
CREATE INDEX IF NOT EXISTS activity_donor ON activity(donorId,event,at);
INSERT OR IGNORE INTO dispatch(requestId,wave) SELECT id,1 FROM request;
"""


def data_root():
    return Path(os.getenv("BLOOD_BUDDY_DATA", Path(__file__).parent / "data"))


_pool = None
_pool_lock = Lock()


def hosted_pool(url):
    global _pool
    with _pool_lock:
        if _pool is None:
            from psycopg_pool import ConnectionPool
            _pool = ConnectionPool(url, min_size=0, max_size=5, kwargs={"connect_timeout": 10})
        return _pool


@contextmanager
def database(room, *, write=False):
    room = UUID(str(room))
    postgres_url = os.getenv("DATABASE_URL") if os.getenv("BLOOD_BUDDY_HOSTED") == "1" else None
    remote = None
    if postgres_url:
        pool = hosted_pool(postgres_url)
        remote = pool.getconn()
        try:
            remote.execute("CREATE TABLE IF NOT EXISTS demo_workspaces (id uuid PRIMARY KEY, contents bytea NOT NULL)")
            remote.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))", (str(room),))
            saved = remote.execute("SELECT contents FROM demo_workspaces WHERE id=%s", (str(room),)).fetchone()
            db = sqlite3.connect(":memory:")
            if saved:
                db.deserialize(bytes(saved[0]))
        except Exception:
            remote.rollback()
            pool.putconn(remote)
            raise
    else:
        if os.getenv("BLOOD_BUDDY_HOSTED") == "1":
            raise RuntimeError("DATABASE_URL is required in hosted mode.")
        root = data_root()
        root.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(root / f"{room}.sqlite3", timeout=10)
    db.row_factory = sqlite3.Row
    try:
        db.execute("PRAGMA foreign_keys=ON")
        if not db.execute("SELECT 1 FROM sqlite_master WHERE name='hospital'").fetchone():
            db.executescript("BEGIN IMMEDIATE;" + SCHEMA + "COMMIT;")
        if not db.execute("SELECT 1 FROM sqlite_master WHERE name='dispatch'").fetchone():
            db.executescript("BEGIN IMMEDIATE;" + DISPATCH_SCHEMA + "COMMIT;")
        if not db.execute("SELECT 1 FROM sqlite_master WHERE name='request_review'").fetchone():
            db.executescript("""BEGIN IMMEDIATE;
                CREATE TABLE IF NOT EXISTS request_review(requestId TEXT PRIMARY KEY REFERENCES request,
                    logistics TEXT, duplicateId TEXT REFERENCES request, reviewedAt INTEGER);
                INSERT OR IGNORE INTO request_review(requestId) SELECT id FROM request;
                COMMIT;""")
        if not db.execute("SELECT 1 FROM sqlite_master WHERE name='stock_day'").fetchone():
            db.executescript("""BEGIN IMMEDIATE;
                CREATE TABLE IF NOT EXISTS stock_issue(token TEXT PRIMARY KEY,bloodGroup TEXT,component TEXT,
                    units INTEGER NOT NULL CHECK(units>0),day TEXT NOT NULL,
                    FOREIGN KEY(bloodGroup,component) REFERENCES stock);
                CREATE INDEX IF NOT EXISTS stock_issue_day ON stock_issue(day,bloodGroup,component);
                CREATE TABLE IF NOT EXISTS stock_day(bloodGroup TEXT,component TEXT,day TEXT,
                    units INTEGER NOT NULL CHECK(units>=0),PRIMARY KEY(bloodGroup,component,day),
                    FOREIGN KEY(bloodGroup,component) REFERENCES stock);
                COMMIT;""")
        if not db.execute("SELECT 1 FROM sqlite_master WHERE name='stock_adjustment'").fetchone():
            db.executescript("""BEGIN IMMEDIATE;
                CREATE TABLE IF NOT EXISTS request_origin(requestId TEXT PRIMARY KEY REFERENCES request, radius INTEGER);
                CREATE TABLE IF NOT EXISTS donor_preference(donorId INTEGER PRIMARY KEY REFERENCES donor, travelLimit INTEGER);
                CREATE TABLE IF NOT EXISTS stock_adjustment(token TEXT PRIMARY KEY, bloodGroup TEXT,component TEXT,
                    operation TEXT,quantity INTEGER,expected INTEGER,beforeCount INTEGER,afterCount INTEGER,at INTEGER,
                    FOREIGN KEY(bloodGroup,component) REFERENCES stock);
                COMMIT;""")
        if not db.execute("SELECT 1 FROM hospital").fetchone():
            db.execute("BEGIN IMMEDIATE")
            if not db.execute("SELECT 1 FROM hospital").fetchone():
                seed_workspace(db)
            db.commit()
        db.execute("BEGIN IMMEDIATE" if write else "BEGIN")
        yield db
        db.commit()
        if remote:
            remote.execute("""INSERT INTO demo_workspaces(id,contents) VALUES(%s,%s)
                ON CONFLICT(id) DO UPDATE SET contents=excluded.contents""", (str(room), db.serialize()))
            remote.commit()
    finally:
        db.close()
        if remote:
            remote.rollback()
            pool.putconn(remote)


def seed_workspace(db):
    db.execute("INSERT INTO hospital(id,name) VALUES(1, 'City Hospital')")
    for d in DEMO_DONORS:
        # Synthetic external-review fixtures: missing, future and past clearance dates.
        eligible_on = date.today() - timedelta(days=d.id + 1)
        if d.id == 4:
            eligible_on = date.today() + timedelta(days=10)
        db.execute("INSERT INTO donor VALUES(?,?,?,?,?,?,?,?,?)", (
            d.id, d.bloodGroup, d.distanceKm, d.available, d.responseRate,
            d.lastActiveDays, d.lastActiveLabel, None if d.id == 7 else eligible_on.isoformat(),
            "WHOLE,PLASMA" if d.id % 3 == 0 else "WHOLE,PLASMA,PLATELET"))
    for i, group in enumerate(ALL_GROUPS):
        for component in ("WHOLE", "PLASMA", "PLATELET"):
            db.execute("INSERT INTO stock VALUES(?,?,?)", (group, component, 2 + i))
