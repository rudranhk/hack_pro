"""Qdrant Cloud wrapper — donor vectors live here, with donor facts as payload."""

from functools import lru_cache

from config import settings


class VectorStoreError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _client():
    if not settings.qdrant_configured:
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY are not set — see server/.env.example")
    from qdrant_client import QdrantClient

    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)


def ensure_collection() -> None:
    from qdrant_client.models import Distance, VectorParams

    client = _client()
    existing = {c.name for c in client.get_collections().collections}
    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=settings.embedding_dim, distance=Distance.COSINE),
        )


def upsert_donors(points: list[dict]) -> int:
    """`points` is a list of {id, vector, payload} dicts."""
    from qdrant_client.models import PointStruct

    ensure_collection()
    structs = [PointStruct(id=p["id"], vector=p["vector"], payload=p["payload"]) for p in points]
    _client().upsert(collection_name=settings.qdrant_collection, points=structs)
    return len(structs)


def search_donors(vector: list[float], allowed_blood_groups: set[str], limit: int) -> list:
    from qdrant_client.models import FieldCondition, Filter, MatchAny

    query_filter = Filter(
        must=[FieldCondition(key="bloodGroup", match=MatchAny(any=sorted(allowed_blood_groups)))]
    )
    return _client().search(
        collection_name=settings.qdrant_collection,
        query_vector=vector,
        query_filter=query_filter,
        limit=limit,
        with_payload=True,
    )
