import json
import os
import time
from datetime import date
from uuid import uuid4

from fastapi import HTTPException

from compatibility import compatible_donor_groups
from config import settings
from database import database
from inventory import inventory_snapshot
from embeddings import EmbeddingError
from scoring import score_candidate
from vector_store import retrieve, VectorStoreError

COMMITTED = {"ACCEPTED", "EN_ROUTE", "ARRIVED", "DONATED"}
ACTIVE = {"ACCEPTED", "EN_ROUTE", "ARRIVED"}
NEXT = {"CANDIDATE": {"INVITED"}, "INVITED": {"ACCEPTED", "DECLINED"},
        "ACCEPTED": {"EN_ROUTE", "WITHDRAWN"}, "EN_ROUTE": {"ARRIVED", "WITHDRAWN"},
        "ARRIVED": {"DONATED", "WITHDRAWN"}}


def rows(db, sql, args=()):
    return [dict(r) for r in db.execute(sql, args)]


def require_row(db, sql, args):
    row = db.execute(sql, args).fetchone()
    if row is None:
        raise HTTPException(404, "Record not found in this workspace.")
    return dict(row)


def record(db, rid, event, donor=None):
    db.execute("INSERT INTO activity(requestId,donorId,event,at) VALUES(?,?,?,?)",
               (rid, donor, event, int(time.time())))


def histories(db):
    return {r["donorId"]: dict(r) for r in db.execute("""SELECT donorId,
        sum(event='INVITED') sent, sum(event='ACCEPTED') accepted, sum(event='DECLINED') declined,
        sum(event='EXPIRED') unanswered, max(CASE WHEN event='INVITED' THEN at END) lastSent,
        sum(event='INVITED' AND at>?) recent FROM activity WHERE donorId IS NOT NULL GROUP BY donorId""",
        (int(time.time()) - 86400,))}


def contact_hold(history):
    last = history.get("lastSent")
    if last is not None and last + settings.cooldown > time.time():
        return "Notification cooldown"
    if history.get("recent", 0) >= settings.daily_limit:
        return "Daily notification limit"
    return None


def evaluate(db, request, radius):
    allowed = compatible_donor_groups(request["bloodGroup"], request["component"])
    busy = {row[0] for row in db.execute("""SELECT i.donorId FROM invitation i JOIN request r ON r.id=i.requestId
        WHERE r.closed IS NULL AND i.status IN ('ACCEPTED','EN_ROUTE','ARRIVED')""")}
    history = histories(db)
    pool, facts = {}, {}
    for d in rows(db, "SELECT d.*,p.travelLimit FROM donor d LEFT JOIN donor_preference p ON p.donorId=d.id ORDER BY d.id"):
        i = d["id"]
        h = history.get(i, {})
        replies = h.get("accepted", 0) + h.get("declined", 0)
        rate = (10 * d["responseRate"] + replies) / (10 + replies + h.get("unanswered", 0))
        reasons = []
        if d["bloodGroup"] not in allowed: reasons.append("Blood group outside component policy")
        if request["component"] not in d["components"].split(","): reasons.append("Component unavailable")
        if not d["available"]: reasons.append("Invitations paused")
        if not d["nextEligible"]: reasons.append("No clearance record")
        elif d["nextEligible"] > date.today().isoformat(): reasons.append("Recorded interval still open")
        if d["distanceKm"] > radius: reasons.append("Outside search radius")
        if d["travelLimit"] is not None and d["distanceKm"] > d["travelLimit"]: reasons.append("Outside donor travel preference")
        if i in busy: reasons.append("Already committed")
        facts[i] = dict(donorId=i, group=d["bloodGroup"], distance=d["distanceKm"], available=bool(d["available"]),
            clearance=d["nextEligible"], response=rate, active=d["lastActiveLabel"], reasons=reasons,
            hold=contact_hold(h), recent=h.get("recent", 0), lastSent=h.get("lastSent"))
        if not reasons:
            d["responseRate"] = rate
            pool[i] = d
    return pool, facts


def eligible(db, request, radius):
    return evaluate(db, request, radius)[0]


def rank(pool, request, *, preview=False):
    ids = list(pool)
    source = "Local rules"
    reason = "Cloud credentials are absent."
    similarities = {}
    query = f"{request['urgency']} request for {request['unitsNeeded']} unit(s) of {request['bloodGroup']} {request['component']}. Nearby available responsive donor."
    preference = request.get("logistics")
    if preference:
        query += " Logistics preference: " + preference
    if not ids:
        reason = "No donor passes the coordination filters."
    elif not preference and not preview:
        reason = "Structured request. No logistics preference requires semantic retrieval."
    elif settings.is_configured:
        try:
            similarities = retrieve(query, compatible_donor_groups(request["bloodGroup"], request["component"]), ids)
            if any(i not in similarities for i in ids):
                raise VectorStoreError("Incomplete vector results. Ranked the full eligible pool locally.")
            source, reason = "Gemini + Qdrant", "Vector retrieval restricted to eligible donor IDs."
        except (EmbeddingError, VectorStoreError) as exc:
            similarities = {}
            reason = str(exc)
    return scored(pool, request, similarities), source, reason, query


def scored(pool, request, similarities):
    matches = []
    for i,d in pool.items():
        breakdown, score = score_candidate(
            exact_blood_match=d["bloodGroup"] == request["bloodGroup"], distance_km=d["distanceKm"],
            review_on_file=bool(d["nextEligible"]), response_rate=d["responseRate"], last_active_days=d["lastActiveDays"])
        matches.append(dict(id=i, score=score, breakdown=breakdown.model_dump(), similarity=similarities.get(i)))
    return sorted(matches,key=lambda m: (-m["score"], -(m["similarity"] or 0), m["id"]))


def secured(db, rid):
    return db.execute("""SELECT count(*) FROM invitation WHERE requestId=?
        AND status IN ('ACCEPTED','EN_ROUTE','ARRIVED','DONATED')""", (rid,)).fetchone()[0]


def previous_request(db, payload):
    row = db.execute("SELECT * FROM request WHERE token=?", (str(payload.token),)).fetchone()
    if row and db.execute("SELECT logistics FROM request_review WHERE requestId=?", (row["id"],)).fetchone()[0] != payload.logistics:
        raise HTTPException(409, "Creation token already belongs to a different logistics preference.")
    if row:
        origin = db.execute("SELECT radius FROM request_origin WHERE requestId=?", (row["id"],)).fetchone()
        if payload.radius != (origin[0] if origin else 5):
            raise HTTPException(409, "Creation token already belongs to a different initial radius.")
    if row and any(row[key] != getattr(payload, key) for key in ("bloodGroup","component","urgency","unitsNeeded")):
        raise HTTPException(409, "Creation token already belongs to a different request.")
    return row["id"] if row else None


def match_request(room, payload, *, existing=None, expand=False, scheduled_wave=None):
    with database(room) as db:
        if existing:
            request = require_row(db, "SELECT * FROM request WHERE id=?", (existing,))
            request["logistics"] = db.execute("SELECT logistics FROM request_review WHERE requestId=?", (existing,)).fetchone()[0]
            if request["closed"] or secured(db, existing) >= request["unitsNeeded"]:
                raise HTTPException(409, "This request is already covered or closed.")
        else:
            previous = previous_request(db, payload)
            if previous:
                return previous, False
            request = payload.model_dump()
        radius = request.get("radius", 5)
        if scheduled_wave == 3:
            radius = max(radius, settings.wave_radius)
        elif expand:
            radius = 15 if radius == 5 else 40
        pool = eligible(db, request, radius)
    # Network calls run outside the write transaction.
    retrieved, source, reason, _ = rank(pool, request)
    with database(room, write=True) as db:
        rid = existing or "REQ-" + uuid4().hex[:10].upper()
        if existing:
            current = require_row(db, "SELECT * FROM request WHERE id=?", (rid,))
            if current["closed"] or current["radius"] != request["radius"] or secured(db, rid) >= request["unitsNeeded"]:
                raise HTTPException(409, "Request changed during matching. Refresh and retry.")
            dispatch = require_row(db, "SELECT * FROM dispatch WHERE requestId=?", (rid,))
            wave = scheduled_wave or dispatch["wave"]
            if scheduled_wave and (dispatch["wave"] + 1 != wave or dispatch["due"] is None or
                                   dispatch["due"] > time.time() or not db.execute("SELECT autoInvite FROM hospital").fetchone()[0]):
                return rid, False
            db.execute("UPDATE request SET radius=?,source=?,reason=? WHERE id=?", (radius, source, reason, rid))
            db.execute("DELETE FROM invitation WHERE requestId=? AND status IN ('CANDIDATE','RETRACTED') AND invited IS NULL", (rid,))
        else:
            previous = previous_request(db, payload)
            if previous:
                return previous, False
            db.execute("INSERT INTO request VALUES(?,?,1,?,?,?,?,?,?,NULL,?,?)",
                       (rid, str(payload.token), request["bloodGroup"], request["component"], request["unitsNeeded"],
                        request["urgency"], radius, int(time.time()), source, reason))
            dup = db.execute("""SELECT id FROM request WHERE id<>? AND closed IS NULL AND created>=?
                    AND bloodGroup=? AND component=? AND unitsNeeded=? AND urgency=? ORDER BY rowid DESC LIMIT 1""",
                    (rid,int(time.time())-1800,request["bloodGroup"],request["component"],request["unitsNeeded"],request["urgency"])).fetchone()
            db.execute("INSERT INTO request_review(requestId,logistics,duplicateId) VALUES(?,?,?)",
                       (rid,request.get("logistics"),dup[0] if dup else None))
            db.execute("INSERT INTO request_origin VALUES(?,?)",(rid,radius))
            wave = 1
            db.execute("INSERT INTO dispatch(requestId,wave,due) VALUES(?,?,?)", (rid, wave, int(time.time())+settings.wave_seconds))
            record(db, rid, "CREATED")
            if dup: record(db,rid,"POSSIBLE_DUPLICATE")
        valid, facts = evaluate(db, request, radius)
        similarities = {m["id"]:m["similarity"] for m in retrieved}
        if source == "Gemini + Qdrant" and valid.keys() - similarities.keys():
            similarities = {}
            source, reason = "Local rules", "Donor availability changed during retrieval. Ranked current records."
            db.execute("UPDATE request SET source=?,reason=? WHERE id=?", (source,reason,rid))
        matches = scored(valid,request,similarities)
        if source == "Gemini + Qdrant":
            record(db, rid, "VECTOR_RETRIEVED")
        record(db, rid, "MATCHED")
        if scheduled_wave:
            db.execute("UPDATE dispatch SET wave=?,due=? WHERE requestId=?", (wave,int(time.time())+settings.wave_seconds,rid))
        if not existing or scheduled_wave:
            record(db, rid, f"WAVE_{wave}_OPENED")
        previous = {r["donorId"]: r["status"] for r in db.execute("SELECT donorId,status FROM invitation WHERE requestId=?", (rid,))}
        for donor, status in previous.items():
            facts[donor]["previous"] = status
        matches.sort(key=lambda m: (facts[m["id"]]["recent"], -m["score"], -(m["similarity"] or 0), m["id"]))
        pending = db.execute("SELECT count(*) FROM invitation WHERE requestId=? AND status='INVITED'", (rid,)).fetchone()[0]
        to_invite = max(0, (request["unitsNeeded"] - secured(db, rid)) * wave - pending)
        if not db.execute("SELECT autoInvite FROM hospital").fetchone()[0]:
            to_invite = 0
        for m in matches:
            f = facts[m["id"]]
            f.update(score=m["score"], breakdown=m["breakdown"])
            send = bool(to_invite and not f["hold"] and m["id"] not in previous)
            state = "INVITED" if send else "CANDIDATE"
            f["decision"] = previous.get(m["id"], state)
            if m["id"] in previous:
                f["reason"] = "Existing invitation retained to prevent repeat contact."
            elif f["hold"]:
                f["reason"] = "Contact deferred under donor notification policy."
            elif send:
                f["reason"] = "Within this wave budget after comparing recent contacts and weighted scores."
            else:
                f["reason"] = "Eligible reserve. Manual dispatch or additional wave capacity required."
            added = db.execute("INSERT OR IGNORE INTO invitation VALUES(?,?,?,?,?,?,?,NULL,NULL)",
                               (rid, m["id"], state, m["score"], json.dumps(m["breakdown"]), m["similarity"],
                                int(time.time()) if send else None)).rowcount
            if added and send:
                record(db, rid, state, m["id"])
                to_invite -= 1
        db.execute("INSERT INTO decision(requestId,wave,at,radius,facts) VALUES(?,?,?,?,?)",
                   (rid,wave,int(time.time()),radius,json.dumps(list(facts.values()))))
    return rid, True


def transition(room, rid, donor_id, target):
    with database(room, write=True) as db:
        req = require_row(db, "SELECT * FROM request WHERE id=?", (rid,))
        offer = require_row(db, "SELECT * FROM invitation WHERE requestId=? AND donorId=?", (rid, donor_id))
        current = offer["status"]
        if current == target:
            return []
        if req["closed"] or target not in NEXT.get(current, set()):
            raise HTTPException(409, "This invitation has changed or the request is closed.")
        if current == "INVITED" and offer["invited"] + settings.invite_seconds <= time.time():
            raise HTTPException(409, "Invitation expired.")
        if target == "INVITED" and contact_hold(histories(db).get(donor_id, {})):
            raise HTTPException(409, "Donor notification cooldown or daily limit applies.")
        if target in {"ACCEPTED", "INVITED"}:
            if secured(db, rid) >= req["unitsNeeded"] or donor_id not in eligible(db, req, req["radius"]):
                raise HTTPException(409, "The donor or requested unit is no longer available.")
        db.execute("""UPDATE invitation SET status=?, invited=coalesce(invited,?),
            responded=coalesce(responded,?) WHERE requestId=? AND donorId=?""",
                   (target, int(time.time()), int(time.time()) if target in {"ACCEPTED","DECLINED"} else None,
                    rid, donor_id))
        if target in {"ARRIVED","DONATED","WITHDRAWN"}:
            db.execute("UPDATE invitation SET etaMinutes=NULL WHERE requestId=? AND donorId=?", (rid, donor_id))
        if target in {"ACCEPTED", "DECLINED", "EN_ROUTE", "ARRIVED", "WITHDRAWN"}:
            db.execute("UPDATE donor SET lastActiveDays=0,lastActiveLabel='this session' WHERE id=?", (donor_id,))
        record(db, rid, target, donor_id)
        # Retire other outstanding offers once the donor commits or the request fills.
        affected = [rid]
        if target == "ACCEPTED":
            for row in db.execute("""SELECT requestId,donorId FROM invitation WHERE status IN ('CANDIDATE','INVITED')
                    AND ((donorId=? AND requestId<>?) OR (requestId=? AND ?))""",
                    (donor_id,rid,rid,secured(db,rid)==req["unitsNeeded"])):
                record(db,row["requestId"],"RETRACTED",row["donorId"])
            affected.extend(row[0] for row in db.execute("""SELECT requestId FROM invitation
                WHERE donorId=? AND requestId<>? AND status IN ('INVITED','CANDIDATE')""", (donor_id, rid)))
            db.execute("""UPDATE invitation SET status='RETRACTED' WHERE donorId=? AND requestId<>?
                AND status IN ('INVITED','CANDIDATE')""", (donor_id, rid))
            if secured(db, rid) == req["unitsNeeded"]:
                record(db, rid, "COVERED")
                db.execute("""UPDATE invitation SET status='RETRACTED' WHERE requestId=?
                    AND status IN ('INVITED','CANDIDATE')""", (rid,))
        if target == "WITHDRAWN" and secured(db, rid) == req["unitsNeeded"] - 1:
            record(db, rid, "SEARCH_REOPENED")
            db.execute("UPDATE dispatch SET due=? WHERE requestId=? AND escalated=0", (int(time.time())+settings.wave_seconds,rid))
        if target == "DONATED":
            group = db.execute("SELECT bloodGroup FROM donor WHERE id=?", (donor_id,)).fetchone()[0]
            db.execute("UPDATE stock SET available=available+1 WHERE bloodGroup=? AND component=?", (group, req["component"]))
            db.execute("UPDATE donor SET nextEligible=NULL WHERE id=?", (donor_id,))
            collected = db.execute("SELECT count(*) FROM invitation WHERE requestId=? AND status='DONATED'", (rid,)).fetchone()[0]
            if collected == req["unitsNeeded"]:
                db.execute("UPDATE request SET closed='FULFILLED' WHERE id=?", (rid,))
                record(db, rid, "FULFILLED")
        return affected


def close_request(room, rid, status):
    with database(room, write=True) as db:
        req = require_row(db, "SELECT * FROM request WHERE id=?", (rid,))
        if req["closed"] == status:
            return False
        if req["closed"]:
            raise HTTPException(409, "Request is already closed.")
        db.execute("UPDATE request SET closed=? WHERE id=?", (status, rid))
        db.execute("""UPDATE invitation SET status='RETRACTED' WHERE requestId=?
            AND status IN ('CANDIDATE','INVITED','ACCEPTED','EN_ROUTE','ARRIVED')""", (rid,))
        record(db, rid, status)
        return True


def availability(room, donor_id, available):
    with database(room, write=True) as db:
        require_row(db, "SELECT id FROM donor WHERE id=?", (donor_id,))
        if not db.execute("UPDATE donor SET available=? WHERE id=? AND available<>?", (available, donor_id, available)).rowcount:
            return False
        if not available:
            for row in db.execute("SELECT requestId FROM invitation WHERE donorId=? AND status IN ('CANDIDATE','INVITED')", (donor_id,)):
                record(db,row["requestId"],"PAUSED_RETRACTED",donor_id)
            db.execute("""UPDATE invitation SET status='RETRACTED' WHERE donorId=?
                AND status IN ('CANDIDATE','INVITED')""", (donor_id,))
        record(db, None, "AVAILABLE" if available else "UNAVAILABLE", donor_id)
        return True


def snapshot(room):
    with database(room) as db:
        requests = rows(db, """SELECT r.*, COALESCE(t.unitsSecured,0) AS unitsSecured FROM request r
            LEFT JOIN (SELECT requestId,count(*) AS unitsSecured FROM invitation
            WHERE status IN ('ACCEPTED','EN_ROUTE','ARRIVED','DONATED') GROUP BY requestId) t
            ON t.requestId=r.id ORDER BY r.created DESC, r.rowid DESC""")
        for req in requests:
            req.pop("token")
            req["review"] = require_row(db,"SELECT duplicateId,reviewedAt,logistics FROM request_review WHERE requestId=?", (req["id"],))
            req["dispatch"] = require_row(db,"SELECT wave,due,escalated FROM dispatch WHERE requestId=?", (req["id"],))
            req["status"] = req["closed"] or ("COVERED" if req["unitsSecured"] == req["unitsNeeded"] else "SEARCHING")
        offers = rows(db, "SELECT * FROM invitation ORDER BY score DESC, similarity DESC, donorId")
        for item in offers:
            item["breakdown"] = json.loads(item["breakdown"])
        donors = rows(db, "SELECT d.*,p.travelLimit FROM donor d LEFT JOIN donor_preference p ON p.donorId=d.id ORDER BY d.id")
        history = histories(db)
        for d in donors:
            h = dict(sent=0,accepted=0,declined=0,unanswered=0,lastSent=None,recent=0) | history.get(d["id"],{})
            d["notifications"] = h | {"hold":contact_hold(h),"cooldownUntil": h["lastSent"] + settings.cooldown if h["lastSent"] else None}
            d["available"] = bool(d["available"])
            d["components"] = d["components"].split(",")
            d["eligible"] = bool(d["nextEligible"] and d["nextEligible"] <= date.today().isoformat())
        hospital = rows(db, "SELECT * FROM hospital")[0]
        hospital["collectionKeyRequired"] = bool(os.getenv("COLLECTION_STAFF_KEY"))
        hospital["autoInvite"] = bool(hospital["autoInvite"])
        return dict(hospital=hospital, requests=requests, offers=offers,
                    donors=donors, stock=inventory_snapshot(db), events=rows(db, "SELECT * FROM activity ORDER BY id DESC"))


def advance_due(room):
    now = int(time.time())
    with database(room) as db:
        expired = rows(db, """SELECT requestId,donorId FROM invitation WHERE status='INVITED' AND invited<=?""",
                       (now-settings.invite_seconds,))
        due = rows(db, """SELECT d.* FROM dispatch d JOIN request r ON r.id=d.requestId
            WHERE r.closed IS NULL AND due<=? AND (SELECT autoInvite FROM hospital)=1 AND
            r.unitsNeeded>(SELECT count(*) FROM invitation WHERE requestId=r.id AND status IN ('ACCEPTED','EN_ROUTE','ARRIVED','DONATED'))""", (now,))
    updates = []
    if expired:
        affected = set()
        with database(room, write=True) as db:
            for item in expired:
                rid, donor = item["requestId"], item["donorId"]
                if db.execute("UPDATE invitation SET status='EXPIRED' WHERE requestId=? AND donorId=? AND status='INVITED' AND invited<=?",
                              (rid,donor,now-settings.invite_seconds)).rowcount:
                    record(db,rid,"EXPIRED",donor)
                    affected.add(rid)
        if affected: updates.append(("invitation.expired", sorted(affected)))
    for job in due:
        rid = job["requestId"]
        if job["wave"] < 3:
            try:
                _, changed = match_request(room,None,existing=rid,scheduled_wave=job["wave"]+1)
            except HTTPException as exc:
                if exc.status_code != 409: raise
                continue
            if changed: updates.append(("dispatch.wave",[rid]))
        else:
            with database(room,write=True) as db:
                req = require_row(db, "SELECT * FROM request WHERE id=?", (rid,))
                if req["closed"] or secured(db,rid)>=req["unitsNeeded"]: continue
                if db.execute("UPDATE dispatch SET due=NULL,escalated=1 WHERE requestId=? AND due<=? AND wave=3 AND (SELECT autoInvite FROM hospital)=1",
                              (rid,now)).rowcount:
                    record(db,rid,"COORDINATOR_ESCALATED")
                    updates.append(("dispatch.escalated",[rid]))
    return updates
