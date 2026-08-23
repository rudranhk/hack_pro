"""
Real-time push channel — genuinely functional, but the frontend demo does not
depend on it by default (kept demo-safe per the "self-contained UI" decision).
A hospital-side event (e.g. a donor accepting) can be broadcast to anyone
subscribed to that request's channel.
"""

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter(tags=["realtime"])


class _ConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, request_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.connections.setdefault(request_id, []).append(ws)

    def disconnect(self, request_id: str, ws: WebSocket) -> None:
        peers = self.connections.get(request_id, [])
        if ws in peers:
            peers.remove(ws)
        if not peers:
            self.connections.pop(request_id, None)

    async def broadcast(self, request_id: str, message: dict) -> int:
        peers = self.connections.get(request_id, [])
        payload = json.dumps(message)
        for peer in list(peers):
            try:
                await peer.send_text(payload)
            except Exception:  # noqa: BLE001 — a dead socket shouldn't break the broadcast
                self.disconnect(request_id, peer)
        return len(peers)


manager = _ConnectionManager()


@router.websocket("/ws/requests/{request_id}")
async def request_channel(websocket: WebSocket, request_id: str) -> None:
    await manager.connect(request_id, websocket)
    try:
        while True:
            # The frontend doesn't need to send anything — this just keeps the socket open
            # and lets the server push events. Echo pings back so clients can health-check.
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(request_id, websocket)


class BroadcastPayload(BaseModel):
    event: str
    data: dict = {}


@router.post("/api/requests/{request_id}/broadcast")
async def broadcast_event(request_id: str, payload: BroadcastPayload) -> dict:
    delivered = await manager.broadcast(request_id, {"event": payload.event, "data": payload.data})
    return {"delivered_to": delivered}
