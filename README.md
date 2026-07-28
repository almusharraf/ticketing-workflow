# Travel Booking Module

An ERP add-on for employee leave travel, fully automated end to end: the
employee's profile and already-decided trip are pulled from the ERP directory
(no manual form), the system searches and auto-selects the cheapest bookable
fare, a manager approves, and it's booked automatically on the balance
already on file — no card details entered anywhere in this app. A downloadable
PDF ticket is generated once booked, and flight status/delay tracking is
available afterward via AviationStack.

Flight search aggregates prices from Duffel, Kiwi.com, Skyscanner,
Travelpayouts, and Amadeus for comparison — **booking always happens through
Duffel**, which re-searches and matches the cheapest fare found at the
current price before purchase; comparison-only sources never affect what's
actually booked.

## Layout

```
backend/   Express + TypeScript API (port 4000)
frontend/  React + Vite frontend (port 5173)
dev.sh     Runs both together (macOS/Linux)
```

## Prerequisites

- Node.js 20+ and npm
- A Duffel API key — get one at https://duffel.com (a `duffel_test_...`
  sandbox key is fine to start; switch to `duffel_live_...` for production).
  This is the only key that's required — the app works fine without any of
  the comparison-source keys below.
- Optional comparison-source keys (all independently optional — a missing
  one just means that source drops out of the results):
  - **Kiwi.com Tequila API** — invitation-only for new partners as of 2026.
  - **Skyscanner Partner API** — requires partner approval
    ([Flights Live Prices docs](https://developers.skyscanner.net/api/flights-live-pricing)).
  - **Travelpayouts Data API** — self-serve signup, cached (not live) fares.
  - **Amadeus Self-Service Flight Offers Search** — self-serve signup today,
    but Amadeus is sunsetting this tier 2026-07-17; treat as a stopgap.
- Optional email notifications — a Gmail address + an
  [App Password](https://myaccount.google.com/apppasswords) (requires 2FA
  on that account). Left unset, the app works exactly the same; emails are
  best-effort and never block or roll back a booking/cancellation.

## Setup

Install dependencies for both apps:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Configure the server environment:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set your Duffel key (and any comparison-source keys
you have — see `.env.example` for the full list):

```
PORT=4000
DUFFEL_API_KEY=duffel_test_your_key_here
DUFFEL_API_VERSION=v2
```

By default, travel requests persist to `backend/data/travel.db`. Running
multiple local instances (e.g. your own dev server plus a second one someone
else is testing with) against the same path shares that data between them —
set a different `DB_PATH` per instance in `.env` if you want isolated data
for parallel dev/test.

## Running

**macOS/Linux** — from the repo root:

```bash
./dev.sh
```

**Windows (PowerShell)** — run each app in its own terminal:

```powershell
cd backend; npm run dev
```

```powershell
cd frontend; npm run dev
```

Then open http://localhost:5173. The API listens on http://localhost:4000
(check http://localhost:4000/health).

## Notes

- Three lifecycle emails are sent best-effort via Gmail (see `SMTP_USER`/
  `SMTP_PASSWORD` above): an approval-request email to the manager when a
  request is auto-created, a booking confirmation to the employee once
  booked, and a cancellation/refund confirmation once cancelled
  (`backend/src/services/notifications.ts` and `email.ts`). None of these
  existed anywhere in this codebase before, even as console.log stand-ins -
  confirmed by grepping the whole backend. `sendEmail()` never throws -
  a failed send is logged clearly but never blocks or undoes the real
  booking/cancellation/approval it's attached to. Verify SMTP credentials in
  isolation with `node_modules/.bin/ts-node src/scripts/testEmail.ts` from
  `backend/` before relying on the full flow.
- Trip requests persist in a local SQLite file (`backend/data/travel.db`,
  gitignored) via Node's built-in `node:sqlite` — survives server restarts.
  Uses `node:sqlite` instead of a package like `better-sqlite3` specifically
  to avoid a native-module build step (no Python/node-gyp toolchain
  required); confirmed live that a genuine process kill + restart still
  finds a request created beforehand. The whole record is stored as one
  JSON blob per row (single-table audit log, not a full relational schema).
- Employees and their pending trips are mocked in
  `backend/src/data/employeeDirectory.ts` (stand-in for the ERP's employee +
  HR-approved-leave records). Add/edit entries there for more test cases.
- Before a request is auto-created, `backend/src/validation/tripValidation.ts`
  checks the passport expires at least 6 months after the trip's return date
  and blocks with a clear message (expiry date + required cutoff) if not.
- Booked trips can be cancelled (`POST /api/travel-requests/:id/cancel`,
  "Cancel trip" button on the confirmation screen, with a confirm step).
  Calls Duffel's two-step order-cancellation flow (quote, then confirm) via
  `backend/src/services/cancellation.ts`. If Duffel refuses (fare rules,
  deadline passed), its exact reason is shown, not a generic error.
  `backend/src/scripts/cancellationRefusalTest.ts` repeatably reproduces a
  real refusal (books a fresh order, cancels it, then cancels the
  already-cancelled order again) and prints Duffel's actual message - run
  with `node_modules/.bin/ts-node src/scripts/cancellationRefusalTest.ts`
  from `backend/`. Confirmed live: `422: This order has already been
  cancelled.` The script's second scenario investigates the other, one-off
  refusal seen once in manual testing - `422: This order cannot be
  cancelled through the API`, Duffel's documented `order_not_cancellable`
  code, gated on whether `"cancel"` is present in an order's
  `available_actions`. Duffel's docs don't say which fares/carriers/order
  types cause it to be absent, so the script books across a few
  routes/cabins and checks `available_actions` directly rather than
  guessing; every real order it could book in sandbox had `cancel` present,
  so this specific refusal is **not reliably reproducible in sandbox** with
  the fare/route combinations available here. The error-surfacing code path
  is already proven correct via the identical mechanism in scenario 1.
- `GET /api/travel-requests` lists every request across all employees
  (newest first) for a read-only audit view at `/history` — no router
  library, just a pathname check in `main.tsx`. Row clicks link back into
  the existing status/confirmation view via `/?id=<requestId>`.
- The approval screen shows the full outbound/return itinerary (airline,
  flight numbers, times, layovers) before the manager approves — not just a
  route/fare summary — since approving immediately triggers auto-payment.
- The automated flow (`POST /api/travel-requests/auto`) only ever picks a
  `source: 'duffel'` offer to submit for approval, even though search results
  are aggregated across all providers — only Duffel offers can actually be
  matched and booked.
- Ticket PDFs (`GET /api/travel-requests/:id/ticket.pdf`) are generated with
  `pdfkit` from the booking record — only available once a request reaches
  `booked` status.
- Flight status tracking (`GET /api/travel-requests/:id/flight-status`, via
  AviationStack) is a schedule/status lookup, not a fares API — it never
  affects search or booking. Confirmed live that the `flight_date` query
  param is gated behind a paid tier (a bare key gets a 403
  `function_access_restricted` if it's included), so the client fetches by
  `flight_iata` only and matches the date client-side. In practice this
  plan's coverage is real-time plus roughly the last day — a leave-travel
  booking made months out will show "no status yet" until much closer to
  the flight date, which is expected, not a bug.
- In Duffel's sandbox, search results include synthetic test content and can
  vary in reliability by route. `LOS`–`LHR` is a known-good route for testing.
  This includes physically implausible results with *real* airline names/
  flight numbers on routes/schedules they don't actually fly — e.g. an
  "American Airlines AA 1274" DMM→DOH "flight" lasting 53 minutes (AA has no
  presence on that route in reality; the flight number is likely a real AA
  domestic-US flight number, just recombined with fabricated route/timing
  data). This is intentional sandbox behavior (real content mixed with
  synthetic route/schedule data for testing), not a bug in this app — no
  code-side filtering can reliably distinguish real vs. synthetic content in
  test mode. Only a `duffel_live_` key resolves it.
- Comparison-source integrations (Kiwi, Skyscanner, Travelpayouts, Amadeus)
  are written against each provider's public API docs but unverified against
  live responses (no live keys were available at the time of writing,
  particularly Kiwi and Skyscanner which require partner approval). Each
  provider client is defensive — it returns no results rather than throwing
  on any request or parsing failure — so a wrong field name there degrades
  silently to "that source shows nothing" rather than breaking search.
  Sanity-check `backend/src/services/providers/*.ts` against a real response
  once you have live keys, particularly `skyscannerProvider.ts`'s segment
  field mapping.
