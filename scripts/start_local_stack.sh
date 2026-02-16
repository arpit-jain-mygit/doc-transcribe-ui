#!/usr/bin/env bash
set -euo pipefail

# Starts UI + API + Worker for local development in one shot.
# Defaults:
# - API:    http://127.0.0.1:8090
# - UI:     http://127.0.0.1:4200
# - Worker: listens on doc_jobs_local

UI_REPO="${UI_REPO:-/Users/arpitjain/VSProjects/doc-transcribe-ui}"
API_REPO="${API_REPO:-/Users/arpitjain/PycharmProjects/doc-transcribe-api}"
WORKER_REPO="${WORKER_REPO:-/Users/arpitjain/PycharmProjects/doc-transcribe-worker}"

REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-8090}"
API_LEGACY_PORT="${API_LEGACY_PORT:-8080}"
UI_HOST="${UI_HOST:-127.0.0.1}"
UI_PORT="${UI_PORT:-4200}"
QUEUE_NAME="${QUEUE_NAME:-doc_jobs_local}"
DLQ_NAME="${DLQ_NAME:-doc_jobs_dead}"
FORCE_RESTART="${FORCE_RESTART:-1}"

LOG_DIR="${LOG_DIR:-/tmp/doc_transcribe_logs}"
mkdir -p "$LOG_DIR"

API_LOG="${LOG_DIR}/api.log"
WORKER_LOG="${LOG_DIR}/worker.log"
UI_LOG="${LOG_DIR}/ui.log"

wait_for_http() {
  local url="$1"
  local name="$2"
  local log_file="$3"
  local attempts="${4:-20}"
  local delay_sec="${5:-1}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name started"
      return 0
    fi
    sleep "$delay_sec"
  done

  echo "FAIL: $name did not become healthy at $url"
  if [[ -f "$log_file" ]]; then
    echo "Last logs from $log_file:"
    tail -n 80 "$log_file" || true
  fi
  exit 1
}

stop_pid_list() {
  local label="$1"
  local pids="$2"
  if [[ -z "$pids" ]]; then
    echo "$label: no running process found"
    return
  fi
  echo "$label: stopping $pids"
  # shellcheck disable=SC2086
  kill $pids || true
}

if [[ "$FORCE_RESTART" == "1" ]]; then
  echo "== Cleaning old instances =="
  stop_pid_list "API($API_PORT)" "$(lsof -tiTCP:"$API_PORT" -sTCP:LISTEN || true)"
  stop_pid_list "API($API_LEGACY_PORT)" "$(lsof -tiTCP:"$API_LEGACY_PORT" -sTCP:LISTEN || true)"
  stop_pid_list "UI($UI_PORT)" "$(lsof -tiTCP:"$UI_PORT" -sTCP:LISTEN || true)"
  stop_pid_list "Worker" "$(pgrep -f '/Users/arpitjain/PycharmProjects/doc-transcribe-worker/.venv/bin/python -m worker.worker_loop' || true)"
  sleep 1
fi

echo "== Checking Redis =="
if ! redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
  echo "FAIL: Redis is not reachable at $REDIS_URL"
  exit 1
fi
echo "Redis OK"

echo "== Starting API (${API_HOST}:${API_PORT}) =="
if curl -fsS "http://${API_HOST}:${API_PORT}/health" >/dev/null 2>&1; then
  echo "API already running"
else
  : >"$API_LOG"
  nohup env REDIS_URL="$REDIS_URL" \
    "$API_REPO/.venv/bin/uvicorn" app:app \
    --app-dir "$API_REPO" \
    --host "$API_HOST" --port "$API_PORT" \
    >"$API_LOG" 2>&1 &
  wait_for_http "http://${API_HOST}:${API_PORT}/health" "API" "$API_LOG"
fi

echo "== Starting Worker (queue=${QUEUE_NAME}) =="
if pgrep -af 'worker.worker_loop' >/dev/null 2>&1; then
  echo "Worker already running"
else
  : >"$WORKER_LOG"
  nohup sh -c "cd \"$WORKER_REPO\" && \
    REDIS_URL=\"$REDIS_URL\" \
    QUEUE_MODE=single \
    QUEUE_NAME=\"$QUEUE_NAME\" \
    DLQ_NAME=\"$DLQ_NAME\" \
    \"$WORKER_REPO/.venv/bin/python\" -m worker.worker_loop" \
    >"$WORKER_LOG" 2>&1 &
  sleep 2
  if ! pgrep -af 'worker.worker_loop' >/dev/null 2>&1; then
    echo "FAIL: Worker did not start"
    tail -n 80 "$WORKER_LOG" || true
    exit 1
  fi
  echo "Worker started"
fi

echo "== Starting UI (${UI_HOST}:${UI_PORT}) =="
if curl -fsS "http://${UI_HOST}:${UI_PORT}" >/dev/null 2>&1; then
  echo "UI already running"
else
  : >"$UI_LOG"
  nohup env API_ORIGIN="http://${API_HOST}:${API_PORT}" \
    HOST="$UI_HOST" \
    PORT="$UI_PORT" \
    python3 "$UI_REPO/server.py" \
    >"$UI_LOG" 2>&1 &
  wait_for_http "http://${UI_HOST}:${UI_PORT}" "UI" "$UI_LOG"
fi

echo
echo "Local stack is up:"
echo "- UI:     http://${UI_HOST}:${UI_PORT}"
echo "- API:    http://${API_HOST}:${API_PORT}"
echo "- Queue:  ${QUEUE_NAME}"
echo "- Logs:   ${LOG_DIR}"
echo "- API log tail:    tail -n 60 ${API_LOG}"
echo "- Worker log tail: tail -n 60 ${WORKER_LOG}"
echo "- UI log tail:     tail -n 60 ${UI_LOG}"
