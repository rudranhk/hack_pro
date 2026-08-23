from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from matching_router import router as matching_router
from models import HealthResponse
from ws_router import router as ws_router

app = FastAPI(
    title="BloodLink Matching Service",
    description="Real-time donor matching over Gemini embeddings + Qdrant Cloud vector search.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        configured=settings.is_configured,
        gemini=settings.gemini_configured,
        qdrant=settings.qdrant_configured,
    )


app.include_router(matching_router, prefix="/api")
app.include_router(ws_router)
