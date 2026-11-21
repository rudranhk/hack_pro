# Blood Buddy backend

FastAPI owns request matching, invitation transitions, inventory, audit history, and workspace snapshots. All included records are synthetic.

## Start locally

Follow the [root setup guide](../README.md#run-locally). The API listens on `127.0.0.1:8000`, with interactive documentation at `/docs`. Local workspaces are SQLite files under `server/data/` or the directory configured by `BLOOD_BUDDY_DATA`. The service starts a single background worker to process invitation deadlines and publishes request-scoped WebSocket updates.

## Hosted operation

The Vercel deployment uses `BLOOD_BUDDY_HOSTED=1` and a Neon-provided `DATABASE_URL`. Each synthetic workspace is serialized as a SQLite database in Postgres. An advisory transaction lock serializes access to each workspace, including concurrent donor responses. This is a demo-scale persistence design.

The Vercel frontend uses `VITE_HOSTED_DEMO=1` and polls the workspace approximately every three seconds. A workspace read processes expired invitations and due waves. Timers advance while a dashboard or donor inbox is polling. Local WebSocket subscriptions remain available in local mode. Vercel service rewrites send `/api/*` and `/ws/*` to FastAPI.

## Matching and providers

The backend applies blood-group and component policy, availability, synthetic clearance dates, radius, travel preference, and active commitments before ranking. The score is a coordination aid. Actual donor screening remains outside this demonstration. See `compatibility.py`, `scoring.py`, and `coordination.py`.

Gemini and Qdrant are optional. Copy `.env.example` to `.env`, set `GEMINI_API_KEY`, `QDRANT_URL`, and `QDRANT_API_KEY`, and restart the backend. A request with a logistics preference can compare synthetic donor notes using Gemini embeddings and Qdrant. Vector similarity only breaks ties after the structured filters and weighted score. If provider calls fail, the request records the fallback reason. The current live demo has no hosted provider credentials and uses local rules.

Use a dedicated synthetic Qdrant collection. Set `QDRANT_COLLECTION`, `GEMINI_EMBEDDING_MODEL`, and `EMBEDDING_DIM` as needed. To index the demo profiles locally, run `.\.venv\Scripts\python seed_donors.py` from `server/`. Never commit keys or production data.

## Configuration

| Variable | Purpose |
| --- | --- |
| `BLOOD_BUDDY_DATA` | Optional local workspace directory |
| `BLOOD_BUDDY_HOSTED` | Set to `1` for hosted Neon persistence and request-driven deadline checks |
| `DATABASE_URL` | Neon Postgres connection string for hosted mode |
| `GEMINI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY` | Optional provider credentials |
| `WAVE_SECONDS`, `INVITE_SECONDS` | Wave interval and invitation expiry in seconds |
| `WAVE_RADIUS_KM` | Minimum radius for the third wave |
| `DONOR_COOLDOWN_SECONDS`, `DONOR_DAILY_LIMIT` | Notification limits |
| `COLLECTION_STAFF_KEY` | Optional shared key for collection confirmation in the demo |
| `CORS_ORIGINS` | Allowed browser origins for the local service |

The default timing values are listed in `.env.example`. Hosted database credentials are supplied through Vercel project environment variables.

## API

All workspace routes accept a UUID `room` query parameter. Main endpoints include `GET /api/workspace`, `POST /api/requests`, `GET /api/requests/{id}/decisions`, request rematching, review, close and reopen actions, invitation transitions, donor preferences, and inventory updates. `GET /api/health` reports whether the optional providers are configured. The running local server exposes the complete request schemas at `/docs`.

Creation and inventory operations use idempotency tokens. Invitation state changes and unit capacity checks execute within a workspace transaction. A recorded collection updates synthetic inventory once.

## Verify

```powershell
cd server
.\.venv\Scripts\python -m unittest discover -v
.\.venv\Scripts\python qa_browser.py
```

The browser script requires Microsoft Edge on Windows and uses temporary data and local provider doubles. See the [technical evaluation](../HACKATHON.md) and [interaction audit](../INTERACTION_AUDIT.md) for coverage and limitations.
