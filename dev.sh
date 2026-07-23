#!/usr/bin/env bash
# Runs both the API server and the web app together, and stops both on Ctrl+C.
set -e

cd "$(dirname "$0")"

(cd backend && npm run dev) &
SERVER_PID=$!

(cd frontend && npm run dev) &
WEB_PID=$!

trap 'kill $SERVER_PID $WEB_PID 2>/dev/null' EXIT INT TERM

wait
