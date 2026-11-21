from functools import lru_cache
from hashlib import sha256
from threading import Lock

from qdrant_client import QdrantClient, models
from config import settings


class VectorStoreError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _client():
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key, timeout=10)


_seed_lock = Lock()


def ensure_collection():
    client = _client()
    name = settings.qdrant_collection
    if not client.collection_exists(name):
        client.create_collection(name, vectors_config=models.VectorParams(
            size=settings.embedding_dim, distance=models.Distance.COSINE))
    info = client.get_collection(name)
    vectors = info.config.params.vectors
    if getattr(vectors, "size", None) != settings.embedding_dim or vectors.distance != models.Distance.COSINE:
        raise VectorStoreError("Qdrant schema mismatch. Configure a separate demo collection.")
    for field in ("bloodGroup", "profileVersion"):
        if field not in info.payload_schema:
            client.create_payload_index(name, field, field_schema=models.PayloadSchemaType.KEYWORD, wait=True)


def profile_version():
    return f"blood-buddy-synthetic-v2/{settings.embedding_model}/{settings.embedding_dim}"


def ensure_profiles(donors):
    from embeddings import embed_text
    with _seed_lock:
        ensure_collection()
        client = _client()
        name = settings.qdrant_collection
        stored = client.retrieve(name, [d.id for d in donors], with_payload=True)
        fingerprints = {d.id: sha256(f"{d.profile_text}|{d.bloodGroup}|{d.distanceKm}".encode()).hexdigest() for d in donors}
        known = set()
        for point in stored:
            payload = point.payload or {}
            if not str(payload.get("profileVersion", "")).startswith("blood-buddy-synthetic-v2/"):
                raise VectorStoreError("Use a dedicated synthetic donor collection.")
            if payload.get("profileVersion") == profile_version() and payload.get("profileHash") == fingerprints[point.id]:
                known.add(point.id)
        points = [models.PointStruct(id=d.id, vector=embed_text(d.profile_text), payload={
            "bloodGroup": d.bloodGroup, "profileVersion": profile_version(), "distanceKm": d.distanceKm,
            "profileHash": fingerprints[d.id],
        }) for d in donors if d.id not in known]
        if points:
            client.upsert(name, points=points, wait=True)
        return len(points)


def retrieve(query, groups, eligible_ids):
    from embeddings import EmbeddingError, embed_text
    from seed_donors import DEMO_DONORS
    try:
        ensure_profiles(DEMO_DONORS)
        result = _client().query_points(
            settings.qdrant_collection, query=embed_text(query),
            query_filter=models.Filter(must=[
                models.HasIdCondition(has_id=eligible_ids),
                models.FieldCondition(key="profileVersion", match=models.MatchValue(value=profile_version())),
                models.FieldCondition(key="bloodGroup", match=models.MatchAny(any=sorted(groups))),
            ]), limit=len(eligible_ids), with_payload=False,
        )
        return {point.id: float(point.score) for point in result.points}
    except (EmbeddingError, VectorStoreError):
        raise
    except Exception as exc:
        raise VectorStoreError("Qdrant retrieval unavailable. Check collection configuration and connectivity.") from exc
