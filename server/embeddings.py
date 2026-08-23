"""Gemini embeddings — turns a request or donor profile description into a vector."""

from functools import lru_cache

from config import settings


class EmbeddingError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _client():
    if not settings.gemini_configured:
        raise EmbeddingError("GEMINI_API_KEY is not set — see server/.env.example")
    from google import genai  # imported lazily so the app can boot without the package mattering yet

    return genai.Client(api_key=settings.gemini_api_key)


def embed_text(text: str) -> list[float]:
    """Embed a single piece of text with Gemini's embedding model."""
    try:
        result = _client().models.embed_content(model=settings.embedding_model, contents=text)
        return list(result.embeddings[0].values)
    except EmbeddingError:
        raise
    except Exception as exc:  # noqa: BLE001 — surface the real SDK error to the caller
        raise EmbeddingError(f"Gemini embedding call failed: {exc}") from exc


def embed_batch(texts: list[str]) -> list[list[float]]:
    return [embed_text(text) for text in texts]
