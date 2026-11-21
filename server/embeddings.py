"""Model-specific, dimension-checked embeddings. Profiles contain synthetic logistics only."""
from functools import lru_cache
from math import isfinite

from config import settings


class EmbeddingError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _client():
    from google import genai
    from google.genai import types
    return genai.Client(api_key=settings.gemini_api_key, http_options=types.HttpOptions(timeout=15000))


@lru_cache(maxsize=256)
def _embedding(model: str, dimension: int, text: str) -> tuple[float, ...]:
    try:
        result = _client().models.embed_content(
            model=model, contents=text, config={"output_dimensionality": dimension}
        )
        values = result.embeddings[0].values
        if len(values) != dimension or not all(isfinite(v) for v in values) or not any(values):
            raise ValueError("Expected a finite, nonzero vector with the configured dimension")
        return tuple(values)
    except Exception as exc:
        raise EmbeddingError("Gemini embedding unavailable. Check model access and dimensions.") from exc


def embed_text(text: str) -> list[float]:
    return list(_embedding(settings.embedding_model, settings.embedding_dim, text))


def embed_batch(texts: list[str]) -> list[list[float]]:
    # Each donor needs an independent vector. Embedding 2 can aggregate multi-part input.
    return [embed_text(text) for text in texts]
