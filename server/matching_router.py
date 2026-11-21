import json
import time
import hmac
import os
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

import coordination as service
from config import settings
from database import database
from models import MatchRequest, MatchResponse, SeedResponse
from ws_router import publish

router = APIRouter()


class CreateRequest(MatchRequest):
    token: UUID
    radius: Literal[5,15,40] = 5


class Availability(BaseModel):
    available: bool


class InvitationAction(BaseModel):
    staffKey: str | None = Field(default=None,max_length=512,repr=False)
    status: Literal["INVITED", "DECLINED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "DONATED", "WITHDRAWN"]


class HospitalSettings(BaseModel):
    autoInvite: bool


class Eta(BaseModel):
    minutes: int | None = Field(ge=1, le=180, strict=True)


class Contact(BaseModel):
    message: Literal["Please check your inbox", "Please check in at reception"]


class CloseAction(BaseModel):
    status: Literal["CLOSED", "CANCELLED"]


@router.get("/workspace")
def workspace(room: UUID):
    if os.getenv("BLOOD_BUDDY_HOSTED") == "1":
        service.advance_due(room)
    return service.snapshot(room)


@router.post("/requests", status_code=201)
async def create(room: UUID, payload: CreateRequest):
    rid, created = await run_in_threadpool(service.match_request, room, payload)
    if created:
        await publish(room, "request.created", [rid])
    return {"id": rid}


@router.post("/requests/{rid}/rematch")
async def rematch(room: UUID, rid: str, expand: bool = False):
    await run_in_threadpool(service.match_request, room, None, existing=rid, expand=expand)
    await publish(room, "request.matched", [rid])
    return {"id": rid}


def donor_requests(room, donor_id):
    with database(room) as db:
        return [r[0] for r in db.execute("SELECT requestId FROM invitation WHERE donorId=?", (donor_id,))]


@router.post("/requests/{rid}/offers/{donor_id}")
async def respond(room: UUID, rid: str, donor_id: int, payload: InvitationAction):
    staff_key = os.getenv("COLLECTION_STAFF_KEY")
    if payload.status == "DONATED" and staff_key and not hmac.compare_digest((payload.staffKey or "").encode(),staff_key.encode()):
        raise HTTPException(403,"A valid collection staff key is required.")
    affected = await run_in_threadpool(service.transition, room, rid, donor_id, payload.status)
    if affected:
        await publish(room, "invitation." + payload.status.lower(), [rid])
        if len(affected) > 1:
            await publish(room, "invitation.retracted", affected[1:])
    return {"status": payload.status}


@router.post("/requests/{rid}/close")
async def close(room: UUID, rid: str, payload: CloseAction):
    if await run_in_threadpool(service.close_request, room, rid, payload.status):
        await publish(room, "request." + payload.status.lower(), [rid])
    return {"status": payload.status}


@router.post("/donors/{donor_id}/availability")
async def availability(room: UUID, donor_id: int, payload: Availability):
    if await run_in_threadpool(service.availability, room, donor_id, payload.available):
        await publish(room, "donor.availability", await run_in_threadpool(donor_requests, room, donor_id))
    return payload


@router.post("/hospital/settings")
async def preferences(room: UUID, payload: HospitalSettings):
    with database(room, write=True) as db:
        changed = db.execute("UPDATE hospital SET autoInvite=? WHERE autoInvite<>?", (payload.autoInvite,payload.autoInvite)).rowcount
    if changed:
        await publish(room, "hospital.settings")
    return payload


@router.post("/requests/{rid}/offers/{donor_id}/eta")
async def eta(room: UUID, rid: str, donor_id: int, payload: Eta):
    with database(room, write=True) as db:
        offer = service.require_row(db,"SELECT status,etaMinutes FROM invitation WHERE requestId=? AND donorId=?", (rid,donor_id))
        if offer["status"] in {"ACCEPTED","EN_ROUTE"} and offer["etaMinutes"]==payload.minutes:
            return payload
        changed = db.execute("""UPDATE invitation SET etaMinutes=? WHERE requestId=? AND donorId=?
            AND status IN ('ACCEPTED','EN_ROUTE')""", (payload.minutes, rid, donor_id)).rowcount
        if not changed:
            raise HTTPException(409, "An active commitment is required to share ETA.")
        service.record(db, rid, "ETA_UPDATED", donor_id)
    await publish(room, "donor.eta", [rid])
    return payload


@router.post("/requests/{rid}/offers/{donor_id}/contact")
async def contact(room: UUID, rid: str, donor_id: int, payload: Contact):
    with database(room, write=True) as db:
        offer = service.require_row(db, "SELECT status FROM invitation WHERE requestId=? AND donorId=?", (rid, donor_id))
        if offer["status"] not in service.ACTIVE:
            raise HTTPException(409, "Contact requires an active commitment.")
        service.record(db, rid, payload.message, donor_id)
    await publish(room, "inbox.message", [rid])
    return payload


@router.post("/requests/match", response_model=MatchResponse)
def preview(payload: MatchRequest, room: UUID = UUID(int=0)):
    if not settings.is_configured:
        raise HTTPException(503, "Configure Gemini and Qdrant for a cloud preview.")
    req = payload.model_dump()
    with database(room) as db:
        pool = service.eligible(db, req, 5)
    matches, source, note, query = service.rank(pool, req, preview=True)
    if pool and source != "Gemini + Qdrant":
        raise HTTPException(502, note)
    candidates = [{**pool[m["id"]], "id": str(m["id"]), "score": m["score"],
                   "vectorSimilarity": m["similarity"], "scoreBreakdown": m["breakdown"]}
                  for m in matches[:payload.topK]]
    return {"query": query, "candidates": candidates, "candidateCount": len(candidates)}


@router.post("/admin/seed", response_model=SeedResponse)
def seed_demo():
    from seed_donors import seed
    if not settings.is_configured:
        raise HTTPException(503, "Configure Gemini and Qdrant before indexing.")
    try:
        return {"seeded": seed(), "collection": settings.qdrant_collection}
    except Exception as exc:
        raise HTTPException(502, "Unable to index the synthetic donor collection.") from exc

@router.get("/requests/{rid}/decisions")
def decisions(room: UUID, rid: str):
    with database(room) as db:
        service.require_row(db, "SELECT id FROM request WHERE id=?", (rid,))
        runs = service.rows(db, "SELECT * FROM decision WHERE requestId=? ORDER BY id DESC", (rid,))
        for run in runs:
            run["facts"] = json.loads(run["facts"])
        return runs

@router.post("/requests/{rid}/review")
async def review(room: UUID, rid: str):
    import time
    with database(room,write=True) as db:
        service.require_row(db, "SELECT id FROM request WHERE id=?", (rid,))
        changed = db.execute("UPDATE request_review SET reviewedAt=? WHERE requestId=? AND reviewedAt IS NULL",
                             (int(time.time()),rid)).rowcount
        if changed:
            service.record(db,rid,"COORDINATOR_REVIEWED")
    if changed:
        await publish(room,"request.reviewed",[rid])
    return {"reviewed":True}


class TravelPreference(BaseModel):
    travelLimit: int | None = Field(ge=1,le=100,strict=True)


@router.post("/donors/{donor_id}/preferences")
async def donor_preferences(room: UUID, donor_id: int, payload: TravelPreference):
    with database(room,write=True) as db:
        donor = service.require_row(db,"SELECT distanceKm FROM donor WHERE id=?", (donor_id,))
        changed = db.execute("""INSERT INTO donor_preference VALUES(?,?) ON CONFLICT(donorId) DO UPDATE
            SET travelLimit=excluded.travelLimit WHERE travelLimit IS NOT excluded.travelLimit""",
            (donor_id,payload.travelLimit)).rowcount
        if not changed:
            return payload
        affected = [r[0] for r in db.execute("SELECT requestId FROM invitation WHERE donorId=?", (donor_id,))]
        if payload.travelLimit is not None and donor["distanceKm"] > payload.travelLimit:
            for row in db.execute("SELECT requestId FROM invitation WHERE donorId=? AND status IN ('INVITED','CANDIDATE')",(donor_id,)):
                service.record(db,row[0],"TRAVEL_LIMIT_RETRACTED",donor_id)
            db.execute("UPDATE invitation SET status='RETRACTED' WHERE donorId=? AND status IN ('INVITED','CANDIDATE')",(donor_id,))
        service.record(db,None,"TRAVEL_PREFERENCE_UPDATED",donor_id)
    await publish(room,"donor.preferences",affected)
    return payload


@router.post("/requests/{rid}/reopen")
async def reopen(room: UUID, rid: str):
    with database(room,write=True) as db:
        req = service.require_row(db,"SELECT closed,unitsNeeded FROM request WHERE id=?", (rid,))
        if req["closed"] is None:
            return {"id":rid}
        if req["closed"] != "CLOSED" or service.secured(db,rid)>=req["unitsNeeded"]:
            raise HTTPException(409,"Only closed requests with outstanding units can reopen.")
        db.execute("UPDATE request SET closed=NULL WHERE id=?",(rid,))
        db.execute("UPDATE dispatch SET wave=1,escalated=0,due=? WHERE requestId=?", (int(time.time())+settings.wave_seconds,rid))
        service.record(db,rid,"REOPENED")
    await publish(room,"request.reopened",[rid])
    return {"id":rid}
