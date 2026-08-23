from fastapi import APIRouter, HTTPException

from compatibility import compatible_donor_groups
from config import settings
from embeddings import EmbeddingError, embed_text
from models import DonorMatch, MatchRequest, MatchResponse, SeedResponse
from scoring import score_candidate
from vector_store import VectorStoreError, search_donors

router = APIRouter(tags=["matching"])


def _require_configured() -> None:
    missing = []
    if not settings.gemini_configured:
        missing.append("GEMINI_API_KEY")
    if not settings.qdrant_configured:
        missing.append("QDRANT_URL / QDRANT_API_KEY")
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"Backend not configured — missing {', '.join(missing)}. See server/.env.example.",
        )


@router.post("/requests/match", response_model=MatchResponse)
def match_request(payload: MatchRequest) -> MatchResponse:
    _require_configured()

    query = (
        f"Emergency need: {payload.unitsNeeded} units of {payload.component.title()} for blood group "
        f"{payload.bloodGroup}, urgency {payload.urgency}. Looking for a compatible, available, "
        "responsive donor nearby."
    )

    try:
        vector = embed_text(query)
        allowed = compatible_donor_groups(payload.bloodGroup, payload.component)
        hits = search_donors(vector, allowed, limit=payload.topK)
    except (EmbeddingError, VectorStoreError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    candidates: list[DonorMatch] = []
    for hit in hits:
        p = hit.payload or {}
        breakdown, total = score_candidate(
            exact_blood_match=p.get("bloodGroup") == payload.bloodGroup,
            distance_km=float(p.get("distanceKm", 0)),
            available=bool(p.get("available", False)),
            response_rate=float(p.get("responseRate", 0)),
            last_active_days=int(p.get("lastActiveDays", 0)),
        )
        candidates.append(
            DonorMatch(
                id=str(hit.id),
                bloodGroup=p.get("bloodGroup"),
                distanceKm=p.get("distanceKm", 0),
                available=p.get("available", False),
                responseRate=p.get("responseRate", 0),
                lastActiveLabel=p.get("lastActiveLabel", "unknown"),
                score=total,
                vectorSimilarity=round(float(hit.score), 4),
                scoreBreakdown=breakdown,
            )
        )

    candidates.sort(key=lambda c: c.score, reverse=True)
    return MatchResponse(query=query, candidateCount=len(candidates), candidates=candidates)


@router.post("/admin/seed", response_model=SeedResponse)
def seed_demo_donors() -> SeedResponse:
    _require_configured()
    from seed_donors import seed

    try:
        count = seed()
    except (EmbeddingError, VectorStoreError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return SeedResponse(seeded=count, collection=settings.qdrant_collection)
