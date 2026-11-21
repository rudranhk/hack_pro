# Blood Buddy interaction audit

## Pages and controls

The inventory below follows the routes registered by React Router. It groups repeated controls with identical behavior, such as the View link on each request. The old mock data and unused prototype components are outside the mounted application.

| Page or shared surface | Controls and outcomes |
|---|---|
| Home, `/` | Hospital and donor navigation links and role cards enter their respective workspaces. The brand returns home. Feature descriptions and roadmap copy are informational. |
| Hospital shell | Sidebar links open the nine hospital sections. On mobile, the menu button opens navigation, focus moves into the panel, Tab stays within it, and Escape, scrim, close or route selection dismisses it. The profile icon opens settings. The bell expands recent database events and its request links open the corresponding record. |
| Overview, `/hospital` | Active Requests opens the open-request filter. Responding Donors shows active commitments. Units Secured shows commitments on open requests, including collected units. Awaiting Reply shows pending invitations. Inventory opens stock. The entire emergency card opens its request. New Request and View All navigate to their destinations. Start fresh demo switches to a separate workspace and preserves the previous run. |
| Requests, `/hospital/requests` | Search matches ID, group, component, urgency, status or hospital. Status, urgency and group filters combine. Filters live in the URL. Clear restores the full list. Empty workspace and no-match results have different recovery actions. |
| New request, `/hospital/requests/new` | Select group and component, adjust bounded unit count, choose urgency, choose initial radius, review, optionally select logistics, submit. Back preserves the draft. Cancel exits. Disabled Next explains missing selections. Creation uses an idempotency token. The initial radius is part of retry validation even after a later expansion. |
| Request detail, `/hospital/requests/:id` | Review the request or inspect a flagged duplicate. Expand score, distance and decision disclosures. Open an invited donor inbox in a separate tab. Send an invitation, rematch or expand radius. Rematching re-evaluates eligibility and records a new decision run. Contact limits can produce zero additional invitations. Send a reminder to a committed donor. Confirm an arrived donor's collection. Close or cancel with confirmation. Reopen a manually closed request with outstanding units. Cancelled and fulfilled requests remain terminal. Saved decisions have a separate retry control if retrieval fails. |
| Donor network, `/hospital/donors` | ID search, group, component, availability, radius and baseline response filters apply together. Each record expands to show coordination details and a link to its demo inbox. |
| Live matches, `/hospital/matches` | The view selector switches between all commitments, responding donors, secured units on open requests, and pending invitations. Each row links to the actual request. |
| Blood stock, `/hospital/stock` | Component tabs update balances and accept arrow keys, Home and End. Low-stock request links prefill the wizard. Select group for the forecast, issue available units with confirmation, enter daily usage or confirm zero. Receive stock, or confirm a physical count including zero. An outdated count receives a conflict. Recent adjustments display timestamps and before/after quantities. Empty history remains visible. |
| Analytics, `/hospital/analytics` | Reporting period changes invitation, response, timing and request totals using persisted timestamps. The chart exposes category names and quantities to assistive technology. A period with no requests displays an empty state. |
| Hospital profile, `/hospital/profile` | Switch automatic invitations on or off, export the workspace to an actual JSON download, or open privacy details. |
| Hospital privacy, `/hospital/privacy` | Read-only explanation of local data, workspace isolation and optional providers. Navigation stays available in the hospital shell. |
| Donor inbox, `/donor` | Switch synthetic donor, choose action language, pause or resume invitations, edit maximum travel distance, open request-specific history, accept or decline, share or clear an ETA, mark departure and arrival, and confirm withdrawal. Hospital reminders appear against the matching request. Donated status appears after hospital confirmation. The privacy link preserves the selected donor. |
| `/donor/alert`, `/donor/screening`, `/donor/status` | Existing deep links open the same persisted donor workspace and use its current actions. Clinical screening remains external. |
| Donor privacy, `/donor/privacy` | Back returns to the selected donor inbox. The brand returns home. |
| Missing request, unknown donor, unmatched URL | Each shows a recovery link to the request list, valid donor inbox, or home. |
| Shared feedback | Buttons guard in-flight mutations. Errors surface with backend detail when available. Success follows the persisted HTTP operation. Dismiss closes a toast. After a snapshot failure the user can retry. Socket reconnect triggers a fresh snapshot; a periodic refresh covers missed invalidations. |

## Important fixes

* A request row previously responded only on its small View link. The entire row now has a single accessible link.
* The location step previously displayed a fixed site without letting the hospital set its initial radius. The review and API now agree on 5, 15 or 40 km.
* Reopening exposed a stale close-confirmation prompt. Completing the action clears the prompt, and opening a different request resets request-local controls.
* A donor can save a self-reported travel limit independently of the hospital search radius. An out-of-range change retracts outstanding invitations while retaining existing commitments. The matching decision records the exclusion.
* Inventory receipts and physical counts use transactions and replay-safe submission tokens. A physical count checks the previously observed balance, preventing it from silently overwriting a concurrent change. Removing the last unit preserves the group/component record and its history.
* Repeating an unchanged availability, automatic invitation or ETA setting no longer broadcasts another update. Existing weighted score factors and component compatibility policies remain in place.

## Test checklist and evidence

| Condition | Executed checks |
|---|---|
| Normal operations | Production-build Edge workflow across independent hospital and donor tabs, request creation, manual and timed invitations, collection, expiry coverage in backend tests, inventory, donor preferences, metrics navigation, filters, downloads and role links. |
| Invalid and empty values | API tests for invalid requirements, radius, quantity, status, missing records, out-of-range travel and impossible transition. Browser checks for empty wizard, donor limit validation, empty network and empty request search. |
| Loading and failures | Initial loading view, disabled in-flight donor save, blocked mutation with error and retry, blocked snapshot with stale-data feedback, failed initial load followed by recovery, dropped socket and reconnect. |
| Repeat and concurrent operations | Double-click during delayed save, conflicting last-unit commitments, stock issue race, duplicate creation, collection retries, stock receipt replay and stale inventory correction. |
| Persistence | Reloaded donor preferences, SQLite-backed snapshots, activity and inventory after multiple operations, and a parsed JSON export. |
| Navigation and accessibility | Role controls, back navigation, filtered URLs, responsive sidebar, Escape, tab arrow key, toast dismissal and missing-page recovery. All 18 route/state cases checked at viewport widths of 360, 768, 1024, 1280 and 1440 pixels. |
| Real-time state | Live unit counters, cross-request retractions, request-specific subscriptions, multiple clients, scheduler events, expiry, and recovery. A document sentinel verifies live updates without a page reload. |
| Browser diagnostics | Chrome DevTools Protocol captures console warnings/errors, runtime exceptions, HTTP errors and uncancelled network failures in the tested tabs. The test distinguishes the network failures deliberately injected during recovery checks. |

From the project root, run `npm.cmd run build` and `npm.cmd run lint`. From `server`, run `.\.venv\Scripts\python.exe -m unittest discover -v` and `.\.venv\Scripts\python.exe qa_browser.py`. Browser QA uses a temporary workspace, a headless Edge installation on Windows, a local Gemini SDK test transport and in-memory Qdrant.

## Operating boundaries

* Optional `COLLECTION_STAFF_KEY` in `server/.env` adds a server-side check specifically for recording a collection. Restart FastAPI after configuration. Staff enter the key at confirmation. The blank setting preserves the local role-switching demonstration. This shared key provides no individual staff identity or institution-wide authorization.
* Inventory is aggregated by blood group and component. Lot identity and expiry dates are unavailable. The stock outlook assumes the coming week repeats the prior seven completed UTC days.
* Browser interaction coverage uses desktop Edge with emulated viewport sizes. Physical mobile devices, screen-reader sessions and hosted provider availability remain unverified. Failure and concurrency checks target state-changing operations; static links and disclosures have no independent backend mutation to fail.
