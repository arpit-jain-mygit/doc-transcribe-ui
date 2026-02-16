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
TRACE_FLOW="${TRACE_FLOW:-1}"

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

trace() {
  [[ "$TRACE_FLOW" == "1" ]] || return 0
  echo "[TRACE] $1"
}

safe_get() {
  local url="$1"
  if [[ -n "${AUTH_HEADER_FLAG[0]}" ]]; then
    "$CURL_BIN" -sS "$url" "${AUTH_HEADER_FLAG[@]}" 2>/dev/null || true
  else
    "$CURL_BIN" -sS "$url" 2>/dev/null || true
  fi
}

maybe_print_diagnostics() {
  if [[ "${DIAG_PRINTED:-0}" == "1" ]]; then
    return 0
  fi
  DIAG_PRINTED=1
  echo "== Failure diagnostics =="
  echo "health: $(safe_get "${API_BASE}/health")"
  echo "contract: $(safe_get "${API_BASE}/contract/job-status")"
  if [[ -n "${CURRENT_JOB_ID:-}" ]]; then
    echo "status(${CURRENT_JOB_ID}): $(safe_get "${API_BASE}/status/${CURRENT_JOB_ID}")"
    print_component_trace_cloud "$CURRENT_JOB_ID"
  fi
}

print_component_trace_cloud() {
  local job_id="$1"
  echo "== Functional trace (${job_id}) =="
  trace "1) UI (Vercel) -> API (Render): upload request submitted"
  trace "2) API -> Redis (Render key-value): metadata + queue push"
  trace "3) Worker -> queue dequeue -> processing start"
  local status_payload status stage progress err_code err_msg out_file
  status_payload="$(safe_get "${API_BASE}/status/${job_id}")"
  status="$(echo "$status_payload" | jq -r '.status // "-"' 2>/dev/null || echo "-")"
  stage="$(echo "$status_payload" | jq -r '.stage // "-"' 2>/dev/null || echo "-")"
  progress="$(echo "$status_payload" | jq -r '.progress // "-"' 2>/dev/null || echo "-")"
  err_code="$(echo "$status_payload" | jq -r '.error_code // "-"' 2>/dev/null || echo "-")"
  err_msg="$(echo "$status_payload" | jq -r '.error_message // "-"' 2>/dev/null || echo "-")"
  out_file="$(echo "$status_payload" | jq -r '.output_filename // "-"' 2>/dev/null || echo "-")"
  trace "4) API /status snapshot: status=${status} stage=${stage} progress=${progress}"
  if [[ "$status" == "FAILED" ]]; then
    trace "5) Failure surfaced: error_code=${err_code} message=${err_msg}"
  elif [[ "$status" == "COMPLETED" ]]; then
    trace "5) Completion surfaced: output_filename=${out_file}"
    trace "6) API signed URL available for download from GCS"
  fi
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
  CURRENT_JOB_ID="$job_id"
  local deadline=$(( $(date +%s) + MAX_WAIT_SEC ))
  local started_at
  started_at="$(date +%s)"
  local last_log_at="$started_at"
  local last_status=""
  local last_resp=""
  local seen_queued="0"
  local seen_processing="0"
  local seen_completed="0"

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

    if [[ "$status" == "QUEUED" && "$seen_queued" == "0" ]]; then
      trace "${label}: API accepted and queued job"
      seen_queued="1"
    fi
    if [[ "$status" == "PROCESSING" && "$seen_processing" == "0" ]]; then
      trace "${label}: Worker picked job and started processing (${stage})"
      seen_processing="1"
    fi

    if [[ "$status" == "COMPLETED" ]]; then
      if [[ "$seen_completed" == "0" ]]; then
        local out_file
        out_file="$(echo "$resp" | jq -r '.output_filename // "transcript.txt"')"
        trace "${label}: Processing completed, output file=${out_file}"
        seen_completed="1"
      fi
      echo "Job ${job_id} completed"
      print_component_trace_cloud "$job_id"
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
  echo "== Cloud Regression: pre-checks =="
  echo "API_BASE=${API_BASE}"
  echo "AUTH_BEARER_TOKEN set=${auth_set}"
  require_file "$SAMPLE_PDF"
  require_file "$SAMPLE_MP3"
  if [[ "$REQUIRE_AUTH" == "1" && -z "$AUTH_BEARER_TOKEN" ]]; then
    fail "AUTH_BEARER_TOKEN is required for cloud regression. Export token and retry."
  fi
  api_health
  trace "Precheck complete: cloud API reachable"

  echo "== OCR test (sample.pdf) =="
  local ocr_resp ocr_job
  ocr_resp="$(submit_job "$SAMPLE_PDF" "OCR")"
  echo "OCR response: $ocr_resp"
  ocr_job="$(extract_job_id "$ocr_resp")"
  trace "OCR flow: UI -> API /upload -> job_id=${ocr_job}"
  poll_job "$ocr_job" "OCR"

  echo "== Transcription test (sample.mp3) =="
  local tr_resp tr_job
  tr_resp="$(submit_job "$SAMPLE_MP3" "TRANSCRIPTION")"
  echo "Transcription response: $tr_resp"
  tr_job="$(extract_job_id "$tr_resp")"
  trace "Transcription flow: UI -> API /upload -> job_id=${tr_job}"
  poll_job "$tr_job" "TRANSCRIPTION"

  echo "PASS: Cloud bounded regression completed"
}

main "$@"
