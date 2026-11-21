"""Synthetic inventory issues and a seven-day consumption baseline, using UTC dates."""
from datetime import date, datetime, timedelta, timezone
from uuid import UUID
from typing import Literal
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from database import database
from models import BloodGroup, Component
from ws_router import publish

router = APIRouter()
WINDOW = 7


def today():
    return datetime.now(timezone.utc).date()


class StockKey(BaseModel):
    bloodGroup: BloodGroup
    component: Component


class Issue(StockKey):
    token: UUID
    units: int = Field(strict=True, ge=1, le=10000)


class DailyUsage(StockKey):
    day: date
    units: int = Field(strict=True, ge=0, le=100000)


@router.post("/stock/issues")
async def issue(room: UUID, payload: Issue):
    key = (payload.bloodGroup, payload.component)
    with database(room, write=True) as db:
        previous = db.execute("SELECT bloodGroup,component,units FROM stock_issue WHERE token=?",
                              (str(payload.token),)).fetchone()
        if previous:
            if tuple(previous) != (*key,payload.units):
                raise HTTPException(409, "This submission token already belongs to another issue.")
            return {"recorded":True}
        changed = db.execute("""UPDATE stock SET available=available-? WHERE bloodGroup=? AND component=?
                                AND available>=?""", (payload.units,*key,payload.units)).rowcount
        if not changed:
            raise HTTPException(409, "Insufficient available stock. Check the current balance.")
        db.execute("INSERT INTO stock_issue(token,bloodGroup,component,units,day) VALUES(?,?,?,?,?)",
                   (str(payload.token),*key,payload.units,today().isoformat()))
    await publish(room,"stock.issued")
    return {"recorded":True}


@router.post("/stock/daily-usage")
async def daily_usage(room: UUID, payload: DailyUsage):
    key = (payload.bloodGroup,payload.component,payload.day.isoformat())
    with database(room,write=True) as db:
        if not 1 <= (today()-payload.day).days <= WINDOW:
            raise HTTPException(422, "Choose one of the last seven completed UTC dates.")
        logged = db.execute("""SELECT coalesce(sum(units),0) FROM stock_issue
                            WHERE bloodGroup=? AND component=? AND day=?""", key).fetchone()[0]
        if payload.units < logged:
            raise HTTPException(409, "Daily total is below the units already issued in this workspace.")
        changed = db.execute("""INSERT INTO stock_day(bloodGroup,component,day,units) VALUES(?,?,?,?)
            ON CONFLICT(bloodGroup,component,day) DO UPDATE SET units=excluded.units
            WHERE stock_day.units<>excluded.units""", (*key,payload.units)).rowcount
    if changed:
        await publish(room,"stock.usage")
    return {"recorded":True}


class Adjustment(StockKey):
    token: UUID
    operation: Literal["RECEIVE","COUNT"]
    quantity: int = Field(ge=0,le=100000,strict=True)
    expected: int = Field(ge=0,strict=True)


@router.post("/stock/adjust")
async def adjust(room: UUID, payload: Adjustment):
    key = (payload.bloodGroup,payload.component)
    body = (*key,payload.operation,payload.quantity,payload.expected)
    with database(room,write=True) as db:
        old = db.execute("SELECT bloodGroup,component,operation,quantity,expected FROM stock_adjustment WHERE token=?", (str(payload.token),)).fetchone()
        if old:
            if tuple(old) != body: raise HTTPException(409,"Submission token already used with different values.")
            return {"recorded":True}
        before = db.execute("SELECT available FROM stock WHERE bloodGroup=? AND component=?",key).fetchone()[0]
        if payload.operation=="COUNT" and before!=payload.expected:
            raise HTTPException(409,"Stock changed since you checked. Refresh the balance and reconfirm your count.")
        if payload.operation=="RECEIVE" and not payload.quantity:
            raise HTTPException(422,"Enter at least one received unit.")
        after = before+payload.quantity if payload.operation=="RECEIVE" else payload.quantity
        db.execute("UPDATE stock SET available=? WHERE bloodGroup=? AND component=?",(after,*key))
        db.execute("INSERT INTO stock_adjustment VALUES(?,?,?,?,?,?,?,?,?)",(str(payload.token),*body,before,after,int(time.time())))
    await publish(room,"stock.adjusted")
    return {"recorded":True}


def inventory_snapshot(db):
    end = today()
    days = [(end-timedelta(days=n)).isoformat() for n in range(1,WINDOW+1)]
    reported = {(r["bloodGroup"],r["component"],r["day"]): r["units"] for r in db.execute(
        "SELECT * FROM stock_day WHERE day BETWEEN ? AND ?", (days[-1],days[0]))}
    logged = {(r["bloodGroup"],r["component"],r["day"]): r["total"] for r in db.execute(
        """SELECT bloodGroup,component,day,sum(units) total FROM stock_issue WHERE day BETWEEN ? AND ?
           GROUP BY bloodGroup,component,day""", (days[-1],end.isoformat()))}
    adjustments = {}
    for item in db.execute("""SELECT * FROM (SELECT operation,bloodGroup,component,beforeCount,afterCount,at,
            row_number() OVER (PARTITION BY bloodGroup,component ORDER BY rowid DESC) n FROM stock_adjustment)
            WHERE n<=5 ORDER BY n"""):
        adjustments.setdefault((item["bloodGroup"],item["component"]),[]).append(dict(item))
    result = []
    for row in db.execute("SELECT * FROM stock ORDER BY bloodGroup,component"):
        key = (row["bloodGroup"],row["component"])
        history = [dict(day=d, units=reported.get((*key,d)), logged=logged.get((*key,d),0)) for d in days]
        complete = all(h["units"] is not None for h in history)
        demand = sum(h["units"] for h in history) if complete else None
        result.append(dict(row) | dict(history=history,adjustments=adjustments.get(key,[]), issuedToday=logged.get((*key,end.isoformat()),0),
            forecastUnits=demand, projectedShortfall=max(0,demand-row["available"]) if complete else None))
    return result
