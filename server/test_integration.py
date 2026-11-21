"""API contracts and local provider integration. No hosted requests or credentials."""
import hashlib
import json
import os
import tempfile
import unittest
import warnings
from contextlib import ExitStack, contextmanager
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from dataclasses import replace
from types import SimpleNamespace
from uuid import uuid4
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient
from google import genai
from qdrant_client import QdrantClient, models

import embeddings
from compatibility import ALL_GROUPS, compatible_donor_groups
from config import settings
from main import app
from seed_donors import DEMO_DONORS
from vector_store import ensure_profiles

REQUIREMENT = dict(bloodGroup="O-", component="WHOLE", urgency="CRITICAL", unitsNeeded=2, logistics="Evening arrival")


@contextmanager
def local_providers():
    """The real Gemini SDK serializes HTTP requests to a deterministic test transport."""
    calls = []
    def respond(request):
        body = json.loads(request.content)
        batched = request.url.path.endswith(":batchEmbedContents")
        assert batched or request.url.path.endswith(":embedContent"), request.url.path
        item = body["requests"][0] if batched else body
        text = item["content"]["parts"][0]["text"]
        dimension = item["outputDimensionality"]
        digest = hashlib.shake_256(text.encode()).digest(dimension)
        values = [(v - 127.5) / 128 for v in digest]
        calls.append(text)
        return httpx.Response(200, json={"embeddings":[{"values":values}]} if batched else {"embedding":{"values":values}})
    with ExitStack() as stack:
        stack.enter_context(warnings.catch_warnings())
        warnings.filterwarnings("ignore", message="Payload indexes have no effect.*")
        sdk = genai.Client(api_key="local-test-only", http_options={
            "base_url": "http://localhost", "client_args":{"transport":httpx.MockTransport(respond)}})
        db = QdrantClient(":memory:")
        stack.callback(db.close)
        stack.callback(sdk.close)
        embeddings._embedding.cache_clear()
        stack.callback(embeddings._embedding.cache_clear)
        for key, value in {"gemini_api_key":"test", "qdrant_url":"local", "qdrant_api_key":"test",
                           "embedding_dim":8}.items():
            stack.enter_context(patch.object(settings, key, value))
        stack.enter_context(patch("embeddings._client", return_value=sdk))
        stack.enter_context(patch("vector_store._client", return_value=db))
        yield db, calls


class IntegrationTests(unittest.TestCase):
    def setUp(self):
        root = self.enterContext(tempfile.TemporaryDirectory())
        self.enterContext(patch.dict(os.environ, BLOOD_BUDDY_DATA=root))
        self.enterContext(patch.object(settings, "gemini_api_key", None))
        self.client = self.enterContext(TestClient(app))
        self.room = str(uuid4())

    def post(self, path, body):
        return self.client.post("/api"+path, params={"room":self.room}, json=body)

    def state(self):
        return self.client.get("/api/workspace", params={"room":self.room}).json()

    def create(self, **kwargs):
        res = self.post("/requests", REQUIREMENT | {"token":str(uuid4())} | kwargs)
        self.assertEqual(res.status_code, 201, res.text)
        return res.json()["id"]

    def socket(self, channel, room=None):
        ws = self.enterContext(self.client.websocket_connect(f"/ws/requests/{channel}?room={room or self.room}"))
        self.assertEqual(ws.receive_json()["event"], "ready")
        return ws

    def test_sdk_qdrant_and_two_unit_workflow(self):
        with local_providers() as (db, calls):
            res = self.post("/admin/seed", {})
            self.assertEqual(res.json().get("seeded"), 16, res.text)
            self.assertEqual(self.post("/admin/seed", {}).json()["seeded"], 0)
            self.assertEqual(len(calls), 16)
            self.assertEqual(db.count(settings.qdrant_collection).count, 16)
            preview = self.post("/requests/match", REQUIREMENT | {"topK":2})
            self.assertEqual(preview.status_code, 200, preview.text)
            ranked = preview.json()["candidates"]
            self.assertEqual([m["id"] for m in ranked], ["1","2"])
            self.assertTrue(all(m["score"] == sum(m["scoreBreakdown"].values()) for m in ranked))
            rid = self.create()
            self.assertEqual(len(calls), 17)
            self.assertIn("2 unit(s) of O- WHOLE", calls[-1])
            state = self.state()
            self.assertEqual(state["requests"][0]["source"], "Gemini + Qdrant")
            offers = state["offers"]
            self.assertEqual([o["donorId"] for o in offers], [1,2,3])
            self.assertEqual([o["status"] for o in offers], ["INVITED","INVITED","CANDIDATE"])
            observers = [self.socket(rid), self.socket(rid), self.socket("workspace")]
            other_room = self.socket(rid, str(uuid4()))
            for donor in (1,2):
                response = self.post(f"/requests/{rid}/offers/{donor}", {"status":"ACCEPTED"})
                self.assertEqual(response.status_code, 200)
                for ws in observers:
                    self.assertEqual(ws.receive_json()["event"], "invitation.accepted")
                r = self.state()["requests"][0]
                self.assertEqual((r["unitsSecured"], r["status"]), (donor, "SEARCHING" if donor == 1 else "COVERED"))
            other_room.send_text("ping")
            self.assertEqual(other_room.receive_text(), "pong")

    def test_stock_forecast_missing_zero_shortfall_and_corrections(self):
        key = dict(bloodGroup="O-",component="WHOLE")
        def balance():
            return next(x for x in self.state()["stock"] if all(x[k]==v for k,v in key.items()))
        now = date(2026,11,22)
        with patch("inventory.today",return_value=now):
            opening = balance()
            self.assertIsNone(opening["forecastUnits"])
            dates = [(now-timedelta(days=n)).isoformat() for n in range(1,8)]
            for day in dates:
                self.assertEqual(self.post("/stock/daily-usage",key | dict(day=day,units=0)).status_code,200)
            self.assertEqual(balance()["forecastUnits"],0)
            ws = self.socket("workspace")
            changed = key | dict(day=dates[0],units=11)
            self.assertEqual(self.post("/stock/daily-usage",changed).status_code,200)
            self.assertEqual(ws.receive_json()["event"],"stock.usage")
            self.assertEqual(balance()["projectedShortfall"],11-opening["available"])
            self.assertEqual(self.post("/stock/daily-usage",changed).status_code,200)
            ws.send_text("ping")
            self.assertEqual(ws.receive_text(),"pong")
            self.assertEqual(balance()["available"],opening["available"])
            for day in (now, now-timedelta(days=8)):
                self.assertEqual(self.post("/stock/daily-usage",changed|dict(day=day.isoformat())).status_code,422)
        with patch("inventory.today",return_value=now+timedelta(days=1)):
            self.assertIsNone(balance()["forecastUnits"])

    def test_stock_issue_race_retry_validation_and_history_floor(self):
        key = dict(bloodGroup="O-",component="WHOLE")
        receipts = [key|dict(units=2,token=str(uuid4())) for _ in range(2)]
        yesterday = date(2026,11,21)
        with patch("inventory.today",return_value=yesterday):
            ws = self.socket("workspace")
            with ThreadPoolExecutor(2) as workers:
                codes = list(workers.map(lambda p:self.post("/stock/issues",p).status_code,receipts))
            self.assertEqual(sorted(codes),[200,409])
            self.assertEqual(ws.receive_json()["event"],"stock.issued")
            original = receipts[codes.index(200)]
            self.assertEqual(self.post("/stock/issues",original).status_code,200)
            self.assertEqual(self.post("/stock/issues",original|dict(units=1)).status_code,409)
            self.assertEqual(self.post("/stock/issues",original|dict(units=True)).status_code,422)
            ws.send_text("ping")
            self.assertEqual(ws.receive_text(),"pong")
        with patch("inventory.today",return_value=yesterday+timedelta(days=1)):
            report = key|dict(day=yesterday.isoformat(),units=1)
            self.assertEqual(self.post("/stock/daily-usage",report).status_code,409)
            self.assertEqual(self.post("/stock/daily-usage",report|dict(units=2)).status_code,200)
            stock = next(x for x in self.state()["stock"] if x["bloodGroup"]=="O-" and x["component"]=="WHOLE")
            self.assertEqual((stock["available"],stock["issuedToday"],stock["history"][0]["logged"]),(0,0,2))

    def test_scope_and_retry_notifications(self):
        one, two = self.create(), self.create()
        first, second = self.socket(one), self.socket(two)
        for ws in (first, second):
            ws.send_text("ping")
            self.assertEqual(ws.receive_text(),"pong")
        path = f"/requests/{one}/offers/1"
        self.assertEqual(self.post(path, {"status":"DECLINED"}).status_code, 200)
        self.assertEqual(first.receive_json()["event"], "invitation.declined")
        second.send_text("ping")
        self.assertEqual(second.receive_text(), "pong", "Declining request one changed no records on request two.")
        self.assertEqual(self.post(path, {"status":"DECLINED"}).status_code, 200)
        first.send_text("ping")
        self.assertEqual(first.receive_text(),"pong", "Idempotent retry must not announce a new response.")

    def test_other_active_offers_receive_retraction(self):
        one, two = self.create(), self.create()
        current, other = self.socket(one), self.socket(two)
        self.assertEqual(self.post(f"/requests/{one}/offers/1", {"status":"ACCEPTED"}).status_code,200)
        self.assertEqual(current.receive_json(), {"event":"invitation.accepted","requests":[one]})
        self.assertEqual(other.receive_json(), {"event":"invitation.retracted","requests":[two]})

    def test_invalid_provider_vectors(self):
        for values in ([1.0], [float("nan")] * 8, [0.0] * 8):
            with self.subTest(vector=values), local_providers(), patch("embeddings._client") as sdk:
                sdk.return_value.models.embed_content.return_value = SimpleNamespace(
                    embeddings=[SimpleNamespace(values=values)])
                self.assertEqual(self.post("/admin/seed",{}).status_code,502)
                self.create()
                self.assertEqual(self.state()["requests"][0]["source"],"Local rules")

    def test_structured_dispatch_duplicate_review_and_retry(self):
        with local_providers() as (_, calls):
            first = self.create(logistics=None)
            second = self.create(logistics=None)
            self.assertEqual(calls,[])
        review = self.state()["requests"][0]["review"]
        self.assertEqual(review["duplicateId"],first)
        self.assertIsNone(review["reviewedAt"])
        with self.client.websocket_connect(f"/ws/requests/{second}?room={self.room}") as ws:
            ws.receive_json()
            self.assertEqual(self.post(f"/requests/{second}/review",{}).status_code,200)
            self.assertEqual(ws.receive_json()["event"],"request.reviewed")
            self.assertEqual(self.post(f"/requests/{second}/review",{}).status_code,200)
        self.assertEqual(sum(e["event"]=="COORDINATOR_REVIEWED" for e in self.state()["events"]),1)
        self.assertIsNotNone(self.state()["requests"][0]["review"]["reviewedAt"])

    def test_daily_limit_survives_pause_and_retries(self):
        with patch.object(settings,"cooldown",0), patch.object(settings,"daily_limit",1):
            one=self.create(unitsNeeded=1)
            self.post(f"/requests/{one}/offers/1",{"status":"DECLINED"})
            two=self.create(unitsNeeded=1)
            self.post("/donors/1/availability",{"available":False})
            self.post("/donors/1/availability",{"available":True})
            self.assertEqual(self.post(f"/requests/{two}/rematch",{}).status_code,200)
            self.assertEqual(self.post(f"/requests/{two}/offers/1",{"status":"INVITED"}).status_code,409)
            self.assertEqual(self.state()["donors"][0]["notifications"]["sent"],1)

    def test_changed_body_same_create_token(self):
        token = str(uuid4())
        self.create(token=token)
        response = self.post("/requests", REQUIREMENT | {"token":token,"bloodGroup":"A+"})
        self.assertEqual(response.status_code, 409)
        self.assertEqual(len(self.state()["requests"]),1)

    def test_contracts_and_errors(self):
        self.assertEqual(self.client.get("/api/health").json()["gemini"],False)
        self.assertEqual(self.client.get("/api/workspace",params={"room":"invalid"}).status_code,422)
        for field, value in [("bloodGroup","Z"),("component","INVALID"),("urgency","LOW"),
                             ("unitsNeeded",0),("unitsNeeded",11),("unitsNeeded",True)]:
            with self.subTest(field=field,value=value):
                self.assertEqual(self.post("/requests",REQUIREMENT | {"token":str(uuid4()),field:value}).status_code,422)
        self.assertEqual(self.post("/admin/seed",{}).status_code,503)
        self.assertEqual(self.post("/requests/match",REQUIREMENT).status_code,503)
        self.assertEqual(self.post("/requests/match",REQUIREMENT | {"topK":0}).status_code,422)
        rid = self.create()
        path=f"/requests/{rid}/offers/1"
        for route, body, expected in [(path,{"status":"DONATED"},409),(path,{"status":"INVALID"},422),
            (path+"/eta",{"minutes":181},422),(path+"/eta",{"minutes":10},409),
            (path+"/contact",{"message":"other"},422),(path+"/contact",{"message":"Please check your inbox"},409),
            ("/donors/9999/availability",{"available":False},404),("/hospital/settings",{},422),
            ("/requests/missing/close",{"status":"CLOSED"},404),("/requests/missing/rematch",{},404)]:
            with self.subTest(route=route):
                self.assertEqual(self.post(route,body).status_code,expected)
        self.assertEqual(self.post(path,{"status":"ACCEPTED"}).status_code,200)
        self.assertEqual(self.post(path+"/contact",{"message":"Please check your inbox"}).status_code,200)
        self.assertEqual(self.post(path+"/eta",{"minutes":10}).status_code,200)
        self.assertEqual(self.post(path+"/eta",{"minutes":None}).status_code,200)
        self.assertEqual(self.post(f"/requests/{rid}/close",{"status":"CLOSED"}).status_code,200)
        self.assertEqual(self.post(path,{"status":"EN_ROUTE"}).status_code,409)

    def test_compatibility_and_preview_matrix(self):
        # Independent oracle for the demo's documented identical-group and plasma policies.
        plasma = {"O":{"AB","O","A","B"},"AB":{"AB"},"A":{"A","AB"},"B":{"B","AB"}}
        with local_providers():
            for group in ALL_GROUPS:
                for component in ("WHOLE","PLATELET","PLASMA"):
                    with self.subTest(group=group,component=component):
                        allowed = {g for g in ALL_GROUPS if (g[:-1] in plasma[group[:-1]] if component=="PLASMA" else g==group)}
                        self.assertEqual(compatible_donor_groups(group,component),allowed)
                        result = self.post("/requests/match", REQUIREMENT | {"bloodGroup":group,"component":component,"topK":20})
                        self.assertEqual(result.status_code,200,result.text)
                        hits=result.json()["candidates"]
                        expected={d["id"] for d in self.state()["donors"] if d["available"] and d["eligible"] and
                                  d["distanceKm"] <= 5 and component in d["components"] and d["bloodGroup"] in allowed}
                        self.assertEqual({int(h["id"]) for h in hits}, expected)
                        self.assertEqual([h["score"] for h in hits],sorted([h["score"] for h in hits],reverse=True))

    def test_changed_seed_refreshes_only_changed_profile(self):
        with local_providers() as (db,calls):
            ensure_profiles(DEMO_DONORS)
            changed = replace(DEMO_DONORS[0], distanceKm=2.75)
            self.assertEqual(ensure_profiles([changed,*DEMO_DONORS[1:]]),1)
            self.assertEqual(len(calls),16)
            self.assertEqual(db.retrieve(settings.qdrant_collection,[changed.id])[0].payload["distanceKm"],2.75)

    def test_schema_mismatch_and_provider_errors(self):
        with local_providers() as (db,_):
            db.create_collection(settings.qdrant_collection, vectors_config=models.VectorParams(size=4,distance=models.Distance.COSINE))
            self.assertEqual(self.post("/requests/match", REQUIREMENT).status_code,502)
            self.assertEqual(self.post("/admin/seed",{}).status_code,502)
            self.create()
            self.assertEqual(self.state()["requests"][0]["source"], "Local rules")
            self.assertIn("schema mismatch",self.state()["requests"][0]["reason"])

    def test_request_radius_reopen_and_donor_preferences(self):
        token=str(uuid4())
        rid=self.create(radius=15,token=token)
        self.assertEqual(self.state()["requests"][0]["radius"],15)
        self.assertEqual(self.create(radius=15,token=token),rid)
        self.assertEqual(self.post("/requests", REQUIREMENT|dict(token=token,radius=5)).status_code,409)
        self.assertEqual(self.post("/requests", REQUIREMENT|dict(token=str(uuid4()),radius=-1)).status_code,422)
        ws=self.socket(rid)
        self.assertEqual(self.post("/donors/1/preferences",{"travelLimit":1}).status_code,200)
        self.assertEqual(ws.receive_json()["event"],"donor.preferences")
        self.assertEqual(self.post(f"/requests/{rid}/offers/1",{"status":"ACCEPTED"}).status_code,409)
        self.assertEqual(self.post("/donors/1/preferences",{"travelLimit":0}).status_code,422)
        self.assertEqual(self.post(f"/requests/{rid}/close",{"status":"CLOSED"}).status_code,200)
        self.assertEqual(self.post(f"/requests/{rid}/reopen",{}).status_code,200)
        self.assertEqual(self.post(f"/requests/{rid}/reopen",{}).status_code,200)
        self.assertEqual(self.state()["requests"][0]["status"],"SEARCHING")
        self.post(f"/requests/{rid}/close",{"status":"CANCELLED"})
        self.assertEqual(self.post(f"/requests/{rid}/reopen",{}).status_code,409)

    def test_stock_adjustment_retry_and_stale_count(self):
        path="/stock/adjust"
        body=dict(bloodGroup="O-",component="WHOLE",operation="RECEIVE",quantity=3,expected=2,token=str(uuid4()))
        for _ in range(2): self.assertEqual(self.post(path,body).status_code,200)
        self.assertEqual(self.post(path,body|dict(quantity=4)).status_code,409)
        count=body|dict(operation="COUNT",quantity=0,token=str(uuid4()))
        self.assertEqual(self.post(path,count).status_code,409)
        self.assertEqual(self.post(path,count|dict(expected=5)).status_code,200)
        self.assertEqual(self.post(path,count|dict(quantity=-1)).status_code,422)
        b=next(b for b in self.state()["stock"] if b["bloodGroup"]=="O-" and b["component"]=="WHOLE")
        self.assertEqual([r["afterCount"] for r in b["adjustments"]],[0,5])
        self.assertEqual(b["available"],0)

    def test_configured_staff_confirmation(self):
        rid=self.create(unitsNeeded=1)
        path=f"/requests/{rid}/offers/1"
        for status in ("ACCEPTED","EN_ROUTE","ARRIVED"): self.assertEqual(self.post(path,dict(status=status)).status_code,200)
        with patch.dict(os.environ,COLLECTION_STAFF_KEY="local-test"):
            self.assertTrue(self.state()["hospital"]["collectionKeyRequired"])
            self.assertEqual(self.post(path,dict(status="DONATED")).status_code,403)
            self.assertEqual(self.post(path,dict(status="DONATED",staffKey="local-test")).status_code,200)
