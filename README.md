# Travel Booking Module

An ERP add-on for employee leave travel: submit a trip request, search real
flights via Duffel, pick one, and book it.

## Layout

```
backend/   Express + TypeScript API (port 4000)
frontend/  React + Vite frontend (port 5173)
dev.sh     Runs both together (macOS/Linux)
```

## Prerequisites

- Node.js 20+ and npm
- A Duffel API key — get one at https://duffel.com (a `duffel_test_...`
  sandbox key is fine to start; switch to `duffel_live_...` for production)

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

Edit `backend/.env` and set your Duffel key:

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
