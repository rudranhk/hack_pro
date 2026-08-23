# BloodLink matching service

A real FastAPI backend: Gemini embeddings + Qdrant Cloud vector search for
donor matching, plus a WebSocket channel for push-style events. This exists
alongside the frontend prototype (which stays fully functional on its own
mock data) — the frontend's "Live match" toggle calls this service when it's
running and configured; otherwise the UI just keeps using demo data.

## Why a vector DB, if the ranking is meant to be explainable?

Vector search (Gemini embedding + Qdrant cosine similarity) is used to
**retrieve and pre-order candidates** from the donor pool — the part of the
problem that's genuinely a similarity search. The score actually **shown to
the hospital** is still the same transparent, weighted formula as the
frontend (`compatibility` / `proximity` / `eligibility margin` / `response
history` / `recent activity`, see `scoring.py`) — never a raw cosine number.
Blood-type compatibility is a hard filter (`compatibility.py`), not something
left to similarity. See the comment at the top of `scoring.py` for the
reasoning.

## Setup

```bash
cd server
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
copy .env.example .env        # Windows; `cp` on macOS/Linux
```

Edit `.env` and fill in:
- `GEMINI_API_KEY` — from https://aistudio.google.com/apikey
- `QDRANT_URL` and `QDRANT_API_KEY` — from your Qdrant Cloud cluster

## Run

```bash
uvicorn main:app --reload --port 8000
```

Then, once:

```bash
curl -X POST http://localhost:8000/api/admin/seed
```

This embeds and upserts the demo donor pool (`seed_donors.py`) into your
Qdrant collection. Re-run it any time you change the seed data.

## Try it

```bash
curl http://localhost:8000/api/health

curl -X POST http://localhost:8000/api/requests/match \
  -H "Content-Type: application/json" \
  -d '{"bloodGroup":"O-","component":"WHOLE","unitsNeeded":2,"urgency":"CRITICAL","topK":5}'
```

## Endpoints

- `GET /api/health` — reports whether Gemini/Qdrant keys are configured
- `POST /api/admin/seed` — embeds and upserts the demo donor pool
- `POST /api/requests/match` — the real matching call (blood-type filter → vector search → explainable scoring)
- `WS /ws/requests/{request_id}` — subscribe to push events for a request
- `POST /api/requests/{request_id}/broadcast` — manually fire an event to that channel (for testing/demoing the socket)

## Without keys

Every endpoint that needs Gemini/Qdrant returns a clear `503` explaining
what's missing, rather than failing silently or pretending to work.
