# Travel Booking Module

An ERP add-on for employee leave travel: submit a trip request, search real
flights, pick one, and book it. Flight search aggregates prices from Duffel,
Kiwi.com, Skyscanner, Travelpayouts, and Amadeus for comparison — **booking
always happens through Duffel**, which re-searches and matches the chosen
flight at the current fare before purchase, regardless of which source showed
it cheapest.

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

- Trip requests are stored in memory on the server — restarting the server
  clears them.
- In Duffel's sandbox, search results include synthetic test content and can
  vary in reliability by route. `LOS`–`LHR` is a known-good route for testing.
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
