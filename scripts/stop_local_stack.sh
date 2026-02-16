#!/usr/bin/env bash
set -euo pipefail

# Stops local UI + API + worker processes used by start_local_stack.sh.

API_PORT="${API_PORT:-8090}"
API_LEGACY_PORT="${API_LEGACY_PORT:-8080}"
UI_PORT="${UI_PORT:-4200}"

API_PIDS="$(lsof -tiTCP:"$API_PORT" -sTCP:LISTEN || true)"
API_LEGACY_PIDS="$(lsof -tiTCP:"$API_LEGACY_PORT" -sTCP:LISTEN || true)"
UI_PIDS="$(lsof -tiTCP:"$UI_PORT" -sTCP:LISTEN || true)"
WORKER_PIDS="$(pgrep -f 'worker.worker_loop' || true)"

stop_group() {
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

stop_group "API($API_PORT)" "$API_PIDS"
stop_group "API($API_LEGACY_PORT)" "$API_LEGACY_PIDS"
stop_group "UI($UI_PORT)" "$UI_PIDS"
stop_group "Worker" "$WORKER_PIDS"

echo "Stop request submitted."
