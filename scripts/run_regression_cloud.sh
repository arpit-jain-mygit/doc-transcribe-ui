#!/usr/bin/env bash
set -euo pipefail

# Cloud bounded regression runner.
# - Tests OCR upload with sample.pdf
# - Tests transcription upload with sample.mp3
# - Polls with hard deadlines (no indefinite wait)

API_BASE="${API_BASE:-https://doc-transcribe-api.onrender.com}"
CURL_BIN="${CURL_BIN:-/usr/bin/curl}"

# Optional auth:
# export AUTH_BEARER_TOKEN="..."
AUTH_BEARER_TOKEN="${AUTH_BEARER_TOKEN:-}"
REQUIRE_AUTH="${REQUIRE_AUTH:-1}"

# File paths (override if needed):
SAMPLE_PDF="${SAMPLE_PDF:-/Users/arpitjain/Downloads/Demo/sample.pdf}"
SAMPLE_MP3="${SAMPLE_MP3:-/Users/arpitjain/Downloads/Demo/sample.mp3}"

# Per-job max wait in seconds
MAX_WAIT_SEC="${MAX_WAIT_SEC:-300}"
POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-3}"
LOG_EVERY_SEC="${LOG_EVERY_SEC:-10}"

if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
  AUTH_HEADER_FLAG=(-H "Authorization: Bearer ${AUTH_BEARER_TOKEN}")
else
  AUTH_HEADER_FLAG=("")
fi

fail() {
  echo "FAIL: $1" >&2
  exit 1
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
  local auth_set="no"
  if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
    auth_set="yes"
  fi
  echo "== Cloud Regression: pre-checks =="
  echo "API_BASE=${API_BASE}"
  echo "AUTH_BEARER_TOKEN set=${auth_set}"
  require_file "$SAMPLE_PDF"
  require_file "$SAMPLE_MP3"
  if [[ "$REQUIRE_AUTH" == "1" && -z "$AUTH_BEARER_TOKEN" ]]; then
    fail "AUTH_BEARER_TOKEN is required for cloud regression. Export token and retry."
  fi
  api_health

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

  echo "PASS: Cloud bounded regression completed"
}

main "$@"
