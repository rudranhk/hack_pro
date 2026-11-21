"""
Central configuration, read from environment variables (via a local .env file).

Nothing here is a secret by itself — copy .env.example to .env and fill in real
values there. .env is gitignored; never commit real keys.
"""

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


def _split_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@dataclass
class Settings:
    gemini_api_key: str | None = field(default_factory=lambda: os.getenv("GEMINI_API_KEY") or None)
    qdrant_url: str | None = field(default_factory=lambda: os.getenv("QDRANT_URL") or None)
    qdrant_api_key: str | None = field(default_factory=lambda: os.getenv("QDRANT_API_KEY") or None)
    qdrant_collection: str = field(default_factory=lambda: os.getenv("QDRANT_COLLECTION", "blood_buddy_demo_v2"))
    embedding_model: str = field(default_factory=lambda: os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2"))
    embedding_dim: int = field(default_factory=lambda: int(os.getenv("EMBEDDING_DIM", "768")))
    cors_origins: list[str] = field(
        default_factory=lambda: _split_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"))
    )

    wave_seconds: int = field(default_factory=lambda: max(1, int(os.getenv("WAVE_SECONDS", "45"))))
    invite_seconds: int = field(default_factory=lambda: max(1, int(os.getenv("INVITE_SECONDS", "90"))))
    cooldown: int = field(default_factory=lambda: max(0, int(os.getenv("DONOR_COOLDOWN_SECONDS", "900"))))
    daily_limit: int = field(default_factory=lambda: max(1, int(os.getenv("DONOR_DAILY_LIMIT", "3"))))
    wave_radius: int = field(default_factory=lambda: max(5, int(os.getenv("WAVE_RADIUS_KM", "15"))))

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def qdrant_configured(self) -> bool:
        return bool(self.qdrant_url and self.qdrant_api_key)

    @property
    def is_configured(self) -> bool:
        return self.gemini_configured and self.qdrant_configured


settings = Settings()
