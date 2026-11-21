#!/usr/bin/env bash
# Starts the original Python backend on a temporary database and runs the integration test against it.
# Usage: BACKEND_DIR=/path/to/RahYaab-BigFive-Game_demo3 npm run test:integration
set -euo pipefail
: "${BACKEND_DIR:?set BACKEND_DIR to the Python project folder}"
PORT="${VE_PORT:-5057}"
DB="$(mktemp -d)/ve_integration.db"
( cd "$BACKEND_DIR" && RAHYAAB_DB="$DB" python3 -c "from backend.app import create_app; create_app(db_path='$DB').run(port=$PORT)" ) &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null && break; sleep 0.2; done
VE_BACKEND_URL="http://127.0.0.1:$PORT" npx jest -c jest.integration.config.js "$@"
