#!/usr/bin/env bash
set -euo pipefail

# Local-first bounded regression runner
# - Tests OCR upload with sample.pdf
# - Tests transcription upload with sample.mp3
# - Polls with hard deadlines (no indefinite wait)

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
REDIS_PING_CMD="${REDIS_PING_CMD:-redis-cli ping}"
CURL_BIN="${CURL_BIN:-/usr/bin/curl}"

# Optional auth:
# export AUTH_BEARER_TOKEN="..."
AUTH_BEARER_TOKEN="${AUTH_BEARER_TOKEN:-}"

# File paths (override if needed):
SAMPLE_PDF="${SAMPLE_PDF:-/Users/arpitjain/Downloads/Demo/sample.pdf}"
SAMPLE_MP3="${SAMPLE_MP3:-/Users/arpitjain/Downloads/Demo/sample.mp3}"

# Per-job max wait in seconds
MAX_WAIT_SEC="${MAX_WAIT_SEC:-90}"
POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-2}"

if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
  AUTH_HEADER_FLAG=(-H "Authorization: Bearer ${AUTH_BEARER_TOKEN}")
else
  AUTH_HEADER_FLAG=("")
fi

fail() {
  echo "FAIL: $1" >&2
  exit 1
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
  local resp
  if [[ -n "${AUTH_HEADER_FLAG[0]}" ]]; then
    resp="$("$CURL_BIN" -fsS -X POST "${API_BASE}/upload" \
      "${AUTH_HEADER_FLAG[@]}" \
      -F "file=@${file_path}" \
      -F "type=${job_type}")" || fail "Upload request failed for ${job_type}"
  else
    resp="$("$CURL_BIN" -fsS -X POST "${API_BASE}/upload" \
      -F "file=@${file_path}" \
      -F "type=${job_type}")" || fail "Upload request failed for ${job_type}"
  fi
  echo "$resp"
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
  local deadline=$(( $(date +%s) + MAX_WAIT_SEC ))

  while true; do
    local now
    now="$(date +%s)"
    [[ "$now" -le "$deadline" ]] || fail "Timeout waiting for job ${job_id} (>${MAX_WAIT_SEC}s)"

    local resp status
    if [[ -n "${AUTH_HEADER_FLAG[0]}" ]]; then
      resp="$("$CURL_BIN" -fsS "${API_BASE}/status/${job_id}" "${AUTH_HEADER_FLAG[@]}")" || fail "Status call failed for ${job_id}"
    else
      resp="$("$CURL_BIN" -fsS "${API_BASE}/status/${job_id}")" || fail "Status call failed for ${job_id}"
    fi
    status="$(echo "$resp" | jq -r '.status // empty')"

    if [[ "$status" == "COMPLETED" ]]; then
      echo "Job ${job_id} completed"
      return 0
    fi
    if [[ "$status" == "FAILED" ]]; then
      local err
      err="$(echo "$resp" | jq -r '.error // .stage // "unknown failure"')"
      fail "Job ${job_id} failed: ${err}"
    fi
    if [[ "$status" == "CANCELLED" ]]; then
      fail "Job ${job_id} was cancelled unexpectedly"
    fi

    sleep "$POLL_INTERVAL_SEC"
  done
}

main() {
  echo "== Local Regression: pre-checks =="
  require_file "$SAMPLE_PDF"
  require_file "$SAMPLE_MP3"
  api_health
  redis_health

  echo "== OCR test (sample.pdf) =="
  local ocr_resp ocr_job
  ocr_resp="$(submit_job "$SAMPLE_PDF" "OCR")"
  echo "OCR response: $ocr_resp"
  ocr_job="$(extract_job_id "$ocr_resp")"
  poll_job "$ocr_job"

  echo "== Transcription test (sample.mp3) =="
  local tr_resp tr_job
  tr_resp="$(submit_job "$SAMPLE_MP3" "TRANSCRIPTION")"
  echo "Transcription response: $tr_resp"
  tr_job="$(extract_job_id "$tr_resp")"
  poll_job "$tr_job"

  echo "PASS: Local bounded regression completed"
}

main "$@"
