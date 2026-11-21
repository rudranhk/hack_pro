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

## Vercel frontend

The Vite frontend has a Vercel configuration for direct links to React routes. Set `VITE_API_BASE_URL` at build time to the HTTPS origin of a separately hosted, accessible matching service, then rebuild and deploy. Production builds show a configuration error when this setting is missing. `npm run dev` continues to use the local FastAPI service by default.

The supplied FastAPI service is a local synthetic demo. It restricts access to loopback clients and stores workspace data in local SQLite files. It needs a suitable hosting and access design with durable storage, a continuously running scheduler, and coordinated WebSocket delivery before a hosted frontend can use it. Vercel frontend deployment alone does not provide those services. Do not use real donor or hospital data with this demo.

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
