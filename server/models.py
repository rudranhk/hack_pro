"""Pydantic models — deliberately shaped to mirror src/lib/types.ts on the frontend."""

from typing import Literal

from pydantic import BaseModel, Field

BloodGroup = Literal["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
Component = Literal["WHOLE", "PLATELET", "PLASMA"]
Urgency = Literal["CRITICAL", "URGENT", "STANDARD"]


class ScoreBreakdown(BaseModel):
    compatibility: int
    proximity: int
    eligibilityMargin: int
    responseHistory: int
    recentActivity: int


class MatchRequest(BaseModel):
    bloodGroup: BloodGroup
    component: Component
    unitsNeeded: int = Field(gt=0, le=10)
    urgency: Urgency
    topK: int = Field(default=5, ge=1, le=20)


class DonorMatch(BaseModel):
    id: str
    bloodGroup: BloodGroup
    distanceKm: float
    available: bool
    responseRate: float
    lastActiveLabel: str
    score: int
    vectorSimilarity: float
    scoreBreakdown: ScoreBreakdown


class MatchResponse(BaseModel):
    query: str
    candidateCount: int
    candidates: list[DonorMatch]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    configured: bool
    gemini: bool
    qdrant: bool


class SeedResponse(BaseModel):
    seeded: int
    collection: str
