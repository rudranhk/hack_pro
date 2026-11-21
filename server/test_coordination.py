"""Regression tests for shared state, scoped sockets and real Qdrant filtering."""
import os
import tempfile
import unittest
import warnings
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
from unittest.mock import patch

from fastapi.testclient import TestClient
from qdrant_client import QdrantClient

from config import settings
from main import app


class CoordinationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.enterContext(patch.dict(os.environ, BLOOD_BUDDY_DATA=self.tmp.name))
        self.enterContext(patch.object(settings, "gemini_api_key", None))
        self.client = self.enterContext(TestClient(app))
        self.room = str(uuid4())

    def post(self, path, body):
        separator = "&" if "?" in path else "?"
        return self.client.post("/api" + path + separator + "room=" + self.room, json=body)

    def state(self):
        return self.client.get("/api/workspace", params={"room":self.room}).json()

    def create(self, **changes):
        body = dict(token=str(uuid4()), bloodGroup="O-", component="WHOLE", unitsNeeded=1, urgency="CRITICAL")
        result = self.post("/requests", body | changes)
        self.assertEqual(result.status_code, 201, result.text)
        return result.json()["id"]

    def offer(self, rid, donor, status):
        return self.post(f"/requests/{rid}/offers/{donor}", {"status":status})

    def test_lifecycle_and_socket(self):
        rid = self.create()
        self.assertEqual(self.state()["requests"][0]["source"], "Local rules")
        with self.client.websocket_connect(f"/ws/requests/{rid}?room={self.room}") as ws:
            self.assertEqual(ws.receive_json()["event"], "ready")
            ws.send_text("ping")
            self.assertEqual(ws.receive_text(), "pong")
            self.assertEqual(self.offer(rid,1,"ACCEPTED").status_code,200)
            self.assertEqual(ws.receive_json()["event"],"invitation.accepted")
        self.assertEqual(self.state()["requests"][0]["status"], "COVERED")
        self.assertEqual(self.offer(rid,1,"EN_ROUTE").status_code,200)
        self.assertEqual(self.post(f"/requests/{rid}/offers/1/eta", {"minutes":12}).status_code,200)
        self.assertEqual(self.offer(rid,1,"ARRIVED").status_code,200)
        for _ in range(2):
            self.assertEqual(self.offer(rid,1,"DONATED").status_code,200)
        state = self.state()
        self.assertEqual(state["requests"][0]["status"],"FULFILLED")
        self.assertEqual(next(s["available"] for s in state["stock"] if s["bloodGroup"]=="O-" and s["component"]=="WHOLE"),3)
        self.assertFalse(state["donors"][0]["eligible"])
        with TestClient(app) as second:
            self.assertEqual(second.get("/api/workspace",params={"room":self.room}).json(),state)
            self.assertEqual(second.get("/api/workspace",params={"room":str(uuid4())}).json()["requests"],[])

    def test_last_unit_and_retries(self):
        token = str(uuid4())
        rid = self.create(token=token)
        self.assertEqual(self.create(token=token),rid)
        self.assertEqual(self.offer(rid,2,"INVITED").status_code,200)
        with ThreadPoolExecutor(2) as threads:
            results = list(threads.map(lambda d:self.offer(rid,d,"ACCEPTED").status_code,[1,2]))
        self.assertEqual(sorted(results),[200,409])
        winner = next(o["donorId"] for o in self.state()["offers"] if o["status"]=="ACCEPTED")
        self.assertEqual(self.offer(rid,winner,"WITHDRAWN").status_code,200)
        self.assertEqual(self.state()["requests"][0]["unitsSecured"],0)
        self.assertEqual(self.post(f"/requests/{rid}/rematch",{}).status_code,200)
        self.assertTrue(any(o["status"]=="INVITED" for o in self.state()["offers"]))

    def test_filters_inbox_and_close(self):
        self.assertEqual(self.post("/hospital/settings", {"autoInvite":False}).status_code,200)
        rid = self.create()
        offers = self.state()["offers"]
        self.assertEqual({o["donorId"] for o in offers},{1,2,3})
        self.assertEqual({o["status"] for o in offers},{"CANDIDATE"})
        self.assertEqual(self.offer(rid,2,"INVITED").status_code,200)
        self.assertEqual(self.offer(rid,2,"DECLINED").status_code,200)
        self.assertEqual(self.post("/donors/1/availability",{"available":False}).status_code,200)
        self.assertEqual(self.offer(rid,1,"ACCEPTED").status_code,409)
        self.assertEqual(self.post(f"/requests/{rid}/rematch?expand=true",{}).status_code,200)
        self.assertIn(6,[o["donorId"] for o in self.state()["offers"]])
        self.assertEqual(self.post(f"/requests/{rid}/close",{"status":"CANCELLED"}).status_code,200)
        self.assertEqual(self.offer(rid,3,"INVITED").status_code,409)

    def test_waves_expiry_fatigue_and_escalation(self):
        from database import database
        from coordination import advance_due
        rid = self.create()
        get_runs = lambda: self.client.get(f"/api/requests/{rid}/decisions",params={"room":self.room}).json()
        initial = get_runs()[0]
        self.assertEqual(len(initial["facts"]),16)
        self.assertIn("Invitations paused",initial["facts"][4]["reasons"])
        self.assertEqual(self.offer(rid,1,"DECLINED").status_code,200)
        for expected in [2,3]:
            with database(self.room,write=True) as db:
                db.execute("UPDATE dispatch SET due=0 WHERE requestId=?", (rid,))
            self.assertIn(("dispatch.wave",[rid]),advance_due(self.room))
            self.assertEqual(get_runs()[0]["wave"],expected)
        self.assertEqual(get_runs()[-1],initial)
        self.assertEqual(get_runs()[0]["radius"],settings.wave_radius)
        with database(self.room,write=True) as db:
            db.execute("UPDATE dispatch SET due=0 WHERE requestId=?", (rid,))
            db.execute("UPDATE invitation SET invited=1 WHERE status='INVITED'")
        self.assertEqual(self.offer(rid,2,"ACCEPTED").status_code,409)
        events=advance_due(self.room)
        self.assertIn(("invitation.expired",[rid]),events)
        self.assertIn(("dispatch.escalated",[rid]),events)
        self.assertEqual(advance_due(self.room),[])
        other=self.create()
        self.assertEqual(self.offer(other,1,"INVITED").status_code,409)
        state=self.state()
        self.assertEqual(state["donors"][0]["notifications"]["declined"],1)
        self.assertEqual(state["donors"][1]["notifications"]["unanswered"],1)
        self.assertTrue(all(d["notifications"]["sent"]<=1 for d in state["donors"]))

    def test_scheduled_decline_then_accept_with_websocket(self):
        from database import database
        rid = self.create()
        self.assertEqual(self.offer(rid,1,"DECLINED").status_code,200)
        with self.client.websocket_connect(f"/ws/requests/{rid}?room={self.room}") as ws:
            self.assertEqual(ws.receive_json()["event"],"ready")
            with database(self.room,write=True) as db:
                db.execute("UPDATE dispatch SET due=0 WHERE requestId=?", (rid,))
            self.assertEqual(ws.receive_json()["event"],"dispatch.wave")
            self.assertEqual(self.offer(rid,2,"ACCEPTED").status_code,200)
            self.assertEqual(ws.receive_json()["event"],"invitation.accepted")
        self.assertEqual(self.state()["requests"][0]["status"],"COVERED")

    def test_vector_path(self):
        client = QdrantClient(":memory:")
        self.addCleanup(client.close)
        self.enterContext(patch.object(settings,"gemini_api_key","test"))
        self.enterContext(patch.object(settings,"qdrant_url","test"))
        self.enterContext(patch.object(settings,"qdrant_api_key","test"))
        self.enterContext(patch.object(settings,"embedding_dim",3))
        self.enterContext(patch("vector_store._client",return_value=client))
        embed = self.enterContext(patch("embeddings.embed_text",return_value=[1.,0.,0.]))
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore",message="Payload indexes have no effect.*")
            self.create(logistics="Evening arrival")
            first = embed.call_count
            self.create(logistics="Evening arrival")
        self.assertEqual(embed.call_count-first,1)
        state = self.state()
        self.assertEqual(state["requests"][0]["source"],"Gemini + Qdrant")
        self.assertEqual({o["donorId"] for o in state["offers"]},{1,2,3})
        self.assertTrue(all(o["similarity"] == 1 for o in state["offers"]))

    def test_cloud_failure_is_visible(self):
        from vector_store import VectorStoreError
        with patch.object(type(settings),"is_configured",True), patch("coordination.retrieve",side_effect=VectorStoreError("Qdrant unavailable")):
            self.create(logistics="Evening arrival")
        r = self.state()["requests"][0]
        self.assertEqual((r["source"], r["reason"]), ("Local rules","Qdrant unavailable"))


if __name__ == "__main__":
    unittest.main()
