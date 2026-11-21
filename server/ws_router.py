"""Single-process, room-scoped event invalidations. Durable snapshots live in SQLite."""
import asyncio
from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import settings

router = APIRouter()
channels = defaultdict(set)


async def publish(room, event, request_ids=()):
    keys = {(str(room), "workspace"), *((str(room), rid) for rid in request_ids)}
    async def send(key, peer):
        try:
            await asyncio.wait_for(peer.send_json({"event": event, "requests": list(request_ids)}), 2)
        except (RuntimeError, OSError, asyncio.TimeoutError):
            channels.get(key, set()).discard(peer)
    await asyncio.gather(*(send(key, peer) for key in keys for peer in tuple(channels.get(key, ()))))


@router.websocket("/ws/requests/{channel}")
async def request_channel(ws: WebSocket, channel: str, room: UUID):
    origin = ws.headers.get("origin")
    if origin and origin not in settings.cors_origins:
        await ws.close(code=1008)
        return
    key = (str(room), channel)
    await ws.accept()
    channels[key].add(ws)
    try:
        await ws.send_json({"event": "ready"})
        while True:
            if await ws.receive_text() == "ping":
                await ws.send_text("pong")
    except (WebSocketDisconnect, OSError, RuntimeError):
        pass
    finally:
        channels[key].discard(ws)
        if not channels[key]:
            del channels[key]
