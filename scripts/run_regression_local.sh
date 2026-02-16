#!/usr/bin/env bash
set -euo pipefail

# Local bounded regression runner.
# - Tests OCR upload with sample.pdf
# - Tests transcription upload with sample.mp3
# - Polls with hard deadlines (no indefinite wait)

API_BASE="${API_BASE:-http://127.0.0.1:8090}"
REDIS_PING_CMD="${REDIS_PING_CMD:-redis-cli -u redis://localhost:6379/0 ping}"
CURL_BIN="${CURL_BIN:-/usr/bin/curl}"
LOG_DIR="${LOG_DIR:-/tmp/doc_transcribe_logs}"
API_LOG="${API_LOG:-${LOG_DIR}/api.log}"
WORKER_LOG="${WORKER_LOG:-${LOG_DIR}/worker.log}"
UI_LOG="${UI_LOG:-${LOG_DIR}/ui.log}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
QUEUE_NAME="${QUEUE_NAME:-doc_jobs_local}"
DLQ_NAME="${DLQ_NAME:-doc_jobs_dead}"

# Optional auth:
# export AUTH_BEARER_TOKEN="..."
AUTH_BEARER_TOKEN="${AUTH_BEARER_TOKEN:-}"
REQUIRE_AUTH="${REQUIRE_AUTH:-1}"

# File paths (override if needed):
SAMPLE_PDF="${SAMPLE_PDF:-/Users/arpitjain/Downloads/Demo/sample.pdf}"
SAMPLE_MP3="${SAMPLE_MP3:-/Users/arpitjain/Downloads/Demo/sample.mp3}"

# Per-job max wait in seconds
MAX_WAIT_SEC="${MAX_WAIT_SEC:-180}"
POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-2}"
LOG_EVERY_SEC="${LOG_EVERY_SEC:-10}"

if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
  AUTH_HEADER_FLAG=(-H "Authorization: Bearer ${AUTH_BEARER_TOKEN}")
else
  AUTH_HEADER_FLAG=("")
fi

fail() {
  maybe_print_diagnostics
  echo "FAIL: $1" >&2
  exit 1
}

print_log_tail() {
  local label="$1"
  local file="$2"
  local lines="${3:-80}"
  if [[ -f "$file" ]]; then
    echo "== ${label} log (last ${lines}) =="
    tail -n "$lines" "$file" || true
  else
    echo "== ${label} log =="
    echo "(not found: $file)"
  fi
}

print_redis_diag() {
  echo "== Redis diagnostics =="
  if ! command -v redis-cli >/dev/null 2>&1; then
    echo "redis-cli not found"
    return 0
  fi
  local q_depth dlq_depth
  q_depth="$(redis-cli -u "$REDIS_URL" LLEN "$QUEUE_NAME" 2>/dev/null || echo "n/a")"
  dlq_depth="$(redis-cli -u "$REDIS_URL" LLEN "$DLQ_NAME" 2>/dev/null || echo "n/a")"
  echo "queue=${QUEUE_NAME} depth=${q_depth}"
  echo "dlq=${DLQ_NAME} depth=${dlq_depth}"
}

maybe_print_diagnostics() {
  if [[ "${DIAG_PRINTED:-0}" == "1" ]]; then
    return 0
  fi
  DIAG_PRINTED=1
  echo "== Failure diagnostics =="
  print_redis_diag
  if [[ -n "${CURRENT_JOB_ID:-}" ]] && command -v redis-cli >/dev/null 2>&1; then
    echo "== Redis job_status:${CURRENT_JOB_ID} =="
    redis-cli -u "$REDIS_URL" HGETALL "job_status:${CURRENT_JOB_ID}" 2>/dev/null || true
  fi
  print_log_tail "API" "$API_LOG" 120
  print_log_tail "Worker" "$WORKER_LOG" 120
  print_log_tail "UI" "$UI_LOG" 60
}

http_call() {
  local method="$1"
  local url="$2"
  local tmp_file
  tmp_file="$(mktemp)"
  local code
  shift 2
  code="$("$CURL_BIN" -sS -o "$tmp_file" -w "%{http_code}" -X "$method" "$url" "$@")"
  local body
  body="$(cat "$tmp_file")"
  rm -f "$tmp_file"
  printf "%s\n%s\n" "$code" "$body"
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "Missing test file: $path"
}

api_health() {
  "$CURL_BIN" -fsS "${API_BASE}/health" >/dev/null || fail "API health check failed at ${API_BASE}/health"
}

redis_health() {
  local out
  out="$(bash -lc "$REDIS_PING_CMD" 2>/dev/null || true)"
  [[ "$out" == "PONG" ]] || fail "Redis ping failed (command: $REDIS_PING_CMD)"
}

submit_job() {
  local file_path="$1"
  local job_type="$2"
  local result code body
  if [[ -n "${AUTH_HEADER_FLAG[0]}" ]]; then
    result="$(http_call POST "${API_BASE}/upload" \
      "${AUTH_HEADER_FLAG[@]}" \
      -F "file=@${file_path}" \
      -F "type=${job_type}")"
  else
    result="$(http_call POST "${API_BASE}/upload" \
      -F "file=@${file_path}" \
      -F "type=${job_type}")"
  fi
  code="$(echo "$result" | sed -n '1p')"
  body="$(echo "$result" | sed -n '2,$p')"
  if [[ ! "$code" =~ ^2 ]]; then
    if [[ "$code" == "401" ]]; then
      fail "Upload request failed for ${job_type} (HTTP 401). Token likely expired/invalid. Body: ${body}"
    fi
    fail "Upload request failed for ${job_type} (HTTP ${code}): ${body}"
  fi
  echo "$body"
}

extract_job_id() {
  local resp="$1"
  local job_id
  job_id="$(echo "$resp" | jq -r '.job_id // empty')"
  [[ -n "$job_id" ]] || fail "Could not extract job_id from response: $resp"
  echo "$job_id"
}

poll_job() {
  local job_id="$1"
  local label="$2"
  CURRENT_JOB_ID="$job_id"
  local deadline=$(( $(date +%s) + MAX_WAIT_SEC ))
  local started_at
  started_at="$(date +%s)"
  local last_log_at="$started_at"
  local last_status=""
  local last_resp=""

  while true; do
    local now
    now="$(date +%s)"
    [[ "$now" -le "$deadline" ]] || fail "Timeout waiting for ${label} job ${job_id} (>${MAX_WAIT_SEC}s). Last status payload: ${last_resp}"

    local result code resp status stage progress elapsed
    if [[ -n "${AUTH_HEADER_FLAG[0]}" ]]; then
      result="$(http_call GET "${API_BASE}/status/${job_id}" "${AUTH_HEADER_FLAG[@]}")"
    else
      result="$(http_call GET "${API_BASE}/status/${job_id}")"
    fi
    code="$(echo "$result" | sed -n '1p')"
    resp="$(echo "$result" | sed -n '2,$p')"
    last_resp="$resp"
    if [[ ! "$code" =~ ^2 ]]; then
      if [[ "$code" == "401" ]]; then
        fail "Status call failed for ${label} job ${job_id} (HTTP 401). Token likely expired/invalid. Body: ${resp}"
      fi
      fail "Status call failed for ${job_id} (HTTP ${code}): ${resp}"
    fi
    status="$(echo "$resp" | jq -r '.status // empty')"
    stage="$(echo "$resp" | jq -r '.stage // "-"')"
    progress="$(echo "$resp" | jq -r '.progress // "-"')"
    elapsed=$(( now - started_at ))

    if [[ "$status" != "$last_status" || $(( now - last_log_at )) -ge "$LOG_EVERY_SEC" ]]; then
      echo "[${label}] t+${elapsed}s status=${status:-UNKNOWN} stage=${stage} progress=${progress}"
      last_log_at="$now"
      last_status="$status"
    fi

    if [[ "$status" == "COMPLETED" ]]; then
      echo "Job ${job_id} completed"
      return 0
    fi
    if [[ "$status" == "FAILED" ]]; then
      local err_code err_msg
      err_code="$(echo "$resp" | jq -r '.error_code // "UNKNOWN_ERROR"')"
      err_msg="$(echo "$resp" | jq -r '.error_message // .error // .stage // "unknown failure"')"
      fail "Job ${job_id} failed [${err_code}]: ${err_msg}"
    fi
    if [[ "$status" == "CANCELLED" ]]; then
      fail "Job ${job_id} was cancelled unexpectedly"
    fi

    sleep "$POLL_INTERVAL_SEC"
  done
}

main() {
  local auth_set="no"
  if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
    auth_set="yes"
  fi
  echo "== Local Regression: pre-checks =="
  echo "API_BASE=${API_BASE}"
  echo "AUTH_BEARER_TOKEN set=${auth_set}"
  require_file "$SAMPLE_PDF"
  require_file "$SAMPLE_MP3"
  if [[ "$REQUIRE_AUTH" == "1" && -z "$AUTH_BEARER_TOKEN" ]]; then
    fail "AUTH_BEARER_TOKEN is required for local regression. Export token and retry."
  fi
  api_health
  redis_health

  echo "== OCR test (sample.pdf) =="
  local ocr_resp ocr_job
  ocr_resp="$(submit_job "$SAMPLE_PDF" "OCR")"
  echo "OCR response: $ocr_resp"
  ocr_job="$(extract_job_id "$ocr_resp")"
  poll_job "$ocr_job" "OCR"

  echo "== Transcription test (sample.mp3) =="
  local tr_resp tr_job
  tr_resp="$(submit_job "$SAMPLE_MP3" "TRANSCRIPTION")"
  echo "Transcription response: $tr_resp"
  tr_job="$(extract_job_id "$tr_resp")"
  poll_job "$tr_job" "TRANSCRIPTION"

  echo "PASS: Local bounded regression completed"
}

main "$@"
