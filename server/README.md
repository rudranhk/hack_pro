# Blood Buddy matching service

Run the two services using the [project guide](../README.md). FastAPI owns request lifecycles, donor state and invitation transitions. SQLite stores one database per demo workspace in gitignored `server/data/`. Set `BLOOD_BUDDY_DATA` to change this directory.

## Optional cloud retrieval

Copy `.env.example` to `.env` inside `server/`. Set `GEMINI_API_KEY`, `QDRANT_URL` and `QDRANT_API_KEY` there. Restart FastAPI. Keep server credentials out of Vite environment variables.

Use a dedicated demo collection. The default model is `gemini-embedding-2` with 768 output dimensions. The retired `text-embedding-004` model cannot serve new embedding requests. Changes to model or dimensions should use a fresh collection. Blood Buddy checks the vector schema, indexes the group and profile version fields, and uses stable donor IDs to avoid duplicate records. Existing unrecognized profiles at those IDs cause a visible fallback.

A logistics preference on an eligible request, or an explicit cloud preview, indexes the synthetic fixture pool. To warm the collection before judging, run `.\.venv\Scripts\python seed_donors.py` from this directory. Profile and query embeddings use the same model and dimensions. SQLite supplies the current eligible ID set. Qdrant applies those IDs and the blood-group filter, then the server ranks the returned donors using the displayed score factors. Similarity breaks score ties. A provider failure records the fallback reason with the request. This is retrieval and scoring without a generative answer stage.

## API and events

Interactive endpoint documentation is available at [local FastAPI docs](http://127.0.0.1:8000/docs). Workspace operations take a UUID `room` query parameter. The request creation token makes retries idempotent. Transitions serialize capacity and donor-commitment checks in a SQLite write transaction. Request decisions and scheduler configuration are documented in the [technical evaluation](../HACKATHON.md). The hospital records collections once and each collection requires a new external review before the donor can match again.

Subscribe to `/ws/requests/{requestId}?room={uuid}` for a request, or use `workspace` as the channel for the dashboard and donor inbox. Sockets deliver event names and affected request IDs. Clients load the latest snapshot on connection, after changes and after reconnect. A heartbeat checks the connection and a periodic read also catches missed events.

This local, single-worker demo exposes interchangeable synthetic roles on the same machine. It stores no real hospital credentials, donor contact information or patient records. Production identity management, clinical verification and external push delivery are outside the local deployment.
