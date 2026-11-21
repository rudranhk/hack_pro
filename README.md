# Blood Buddy

Blood Buddy is a local emergency blood donor coordination demo. One React application gives a synthetic hospital and donor inboxes independent views of the same SQLite records. FastAPI commits each action before broadcasting a WebSocket update.

## Run locally

Use Python 3.11+ and Node.js 22.12+ (or a current Node 24 release). In a Windows PowerShell terminal at the project root:

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

In a second terminal at the project root:

```powershell
npm ci
npm run dev -- --port 5173 --strictPort
```

Open [Blood Buddy](http://localhost:5173). Use one backend worker. The demo role switcher, HTTP API and notification channels are designed for loopback access.

## Vercel services

The Vercel configuration routes `/api/*` and `/ws/*` to FastAPI and other paths to the Vite app. Browser requests use the same origin in production. For `vercel dev`, set `VITE_API_BASE_URL=/` so the Vite development build uses the Vercel router. For the existing separate local servers, `npm run dev` continues to use FastAPI on port 8000. An explicit `VITE_API_BASE_URL` can point to a different backend.

The local service stores workspaces in SQLite files. Hosted demo mode uses the provisioned Neon database to persist each synthetic workspace, with a PostgreSQL advisory lock serializing concurrent workspace changes. Hosted clients poll every three seconds and each workspace read checks invitation deadlines. Timers therefore advance while a dashboard is open. The hosted demo exposes interchangeable synthetic roles and has no user authentication. Do not use real donor or hospital data.

## Judge walkthrough

Open Hospital and select **Start fresh demo**. Submit the critical O-negative request, inspect the matching decisions, decline from the first donor inbox, then accept from the second donor inbox after wave 2 opens. Keep the hospital dashboard open to watch the commitments change.

The [technical evaluation and five-minute script](HACKATHON.md) includes the competitive comparison, dispatch policy, architecture, database schema, API and WebSocket contracts, test coverage and production limitations.

Open **Hospital → Blood Stock → Seven-day stock outlook** to record an issue or inspect projected consumption. Select the component and blood group, then confirm the last seven completed UTC dates under **Daily usage history**. The outlook shows the shortfall if the coming week repeats those recorded totals with no replenishment.

## Matching modes

Without credentials, FastAPI filters the synthetic donor registry and ranks eligible candidates locally. The request page displays **Local rules** and the reason. Structured requests always use local rules. For optional logistics-note retrieval, select a logistics preference on the review step and configure the two providers as described in [the backend guide](server/README.md). Only completed vector searches display **Gemini + Qdrant**.

Synthetic records represent an external review and an earliest eligible date for their listed components. Missing review, future dates, existing commitments, unavailability and distance exclude donors before retrieval. Whole blood and platelets use an identical-group outreach policy. Plasma uses a separate deterministic filter. Clinical screening and approval are external to this demonstration.

The [page and interaction audit](INTERACTION_AUDIT.md) covers dashboard drill-downs, donor preferences, inventory controls and optional staff confirmation.

## Verification

```powershell
npm run build
npm run lint
cd server
.\.venv\Scripts\python -m unittest discover -v
.\.venv\Scripts\python qa_browser.py
```

The regression suite uses temporary databases, two simultaneous responses to the last unit, a request WebSocket and an in-memory Qdrant collection with synthetic test embeddings.
