import asyncio
import logging
from contextlib import asynccontextmanager, suppress
from uuid import UUID
from coordination import advance_due
from database import data_root
from ws_router import publish
from ipaddress import ip_address
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import PlainTextResponse

from config import settings
from matching_router import router as matching_router
from inventory import router as inventory_router
from models import HealthResponse
from ws_router import router as ws_router


class LocalDemoAccess:
    """The synthetic role switcher is intentionally limited to a loopback deployment."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in {"http", "websocket"}:
            peer = (scope.get("client") or ("",))[0]
            try:
                local = ip_address(peer).is_loopback
            except ValueError:
                local = peer == "testclient"
            origin = dict(scope["headers"]).get(b"origin")
            if not local or (origin and origin.decode() not in settings.cors_origins):
                if scope["type"] == "websocket":
                    await send({"type": "websocket.close", "code": 1008})
                else:
                    await PlainTextResponse("Local demo access only", status_code=403)(scope, receive, send)
                return
        await self.app(scope, receive, send)


async def dispatch_loop():
    while True:
        for path in data_root().glob("*.sqlite3"):
            try:
                room = UUID(path.stem)
            except ValueError:
                continue
            try:
                updates = await asyncio.to_thread(advance_due, room)
                for event, ids in updates:
                    await publish(room, event, ids)
            except Exception:
                logging.exception("Unable to process dispatch deadlines for workspace %s", room)
        await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app):
    worker = asyncio.create_task(dispatch_loop())
    try:
        yield
    finally:
        worker.cancel()
        with suppress(asyncio.CancelledError):
            await worker


app = FastAPI(lifespan=lifespan, title="Blood Buddy Matching Service", description="Synthetic local coordination workspace.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET","POST"],
                   allow_headers=["Content-Type"])
app.add_middleware(LocalDemoAccess)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "testserver"])


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", configured=settings.is_configured, gemini=settings.gemini_configured,
                          qdrant=settings.qdrant_configured)


app.include_router(matching_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(ws_router)
