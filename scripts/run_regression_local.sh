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
CLOUD_QUEUE_NAME="${CLOUD_QUEUE_NAME:-doc_jobs}"
REQUIRE_LOCAL_WORKER="${REQUIRE_LOCAL_WORKER:-1}"
EXPECT_WORKER_BOTH_QUEUES="${EXPECT_WORKER_BOTH_QUEUES:-1}"

# Optional auth:
# export AUTH_BEARER_TOKEN="..."
AUTH_BEARER_TOKEN="${AUTH_BEARER_TOKEN:-}"
REQUIRE_AUTH="${REQUIRE_AUTH:-1}"
AUTH_TOKEN_FILE="${AUTH_TOKEN_FILE:-/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/.auth_token.local}"
TOKEN_SOURCE="unset"
TOKEN_FILE_PRIORITY="${TOKEN_FILE_PRIORITY:-1}"

# File paths (override if needed):
SAMPLE_PDF="${SAMPLE_PDF:-/Users/arpitjain/Downloads/Demo/sample.pdf}"
SAMPLE_MP3="${SAMPLE_MP3:-/Users/arpitjain/Downloads/Demo/sample.mp3}"

# Per-job max wait in seconds
MAX_WAIT_SEC="${MAX_WAIT_SEC:-180}"
POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-2}"
LOG_EVERY_SEC="${LOG_EVERY_SEC:-10}"
TRACE_FLOW="${TRACE_FLOW:-1}"
RUN_START_EPOCH="$(date +%s)"
RUN_START_ISO="$(TZ=Asia/Kolkata date +%Y-%m-%dT%H:%M:%S%z)"

if [[ -t 1 ]]; then
  C_GREEN=$'\033[32m'
  C_RED=$'\033[31m'
  C_BLUE=$'\033[34m'
  C_RESET=$'\033[0m'
else
  C_GREEN=""
  C_RED=""
  C_BLUE=""
  C_RESET=""
fi

icon_info() { printf "%sℹ%s %s\n" "$C_BLUE" "$C_RESET" "$1"; }
icon_ok() { printf "%s✔%s %s\n" "$C_GREEN" "$C_RESET" "$1"; }
icon_fail() { printf "%s✖%s %s\n" "$C_RED" "$C_RESET" "$1" >&2; }

STEP_NAME=""
STEP_START_EPOCH=0
STEP_START_ISO=""

begin_step() {
  STEP_NAME="$1"
  STEP_START_EPOCH="$(date +%s)"
  STEP_START_ISO="$(TZ=Asia/Kolkata date +%Y-%m-%dT%H:%M:%S%z)"
  icon_info "${STEP_NAME} START_IST=${STEP_START_ISO}"
}

end_step_ok() {
  local end_epoch end_iso step_sec
  end_epoch="$(date +%s)"
  end_iso="$(TZ=Asia/Kolkata date +%Y-%m-%dT%H:%M:%S%z)"
  step_sec=$(( end_epoch - STEP_START_EPOCH ))
  icon_ok "${STEP_NAME} END_IST=${end_iso} STEP_SEC=${step_sec}"
  STEP_NAME=""
  STEP_START_EPOCH=0
  STEP_START_ISO=""
}

end_step_fail() {
  if [[ -z "$STEP_NAME" || "$STEP_START_EPOCH" -eq 0 ]]; then
    return 0
  fi
  local end_epoch end_iso step_sec
  end_epoch="$(date +%s)"
  end_iso="$(TZ=Asia/Kolkata date +%Y-%m-%dT%H:%M:%S%z)"
  step_sec=$(( end_epoch - STEP_START_EPOCH ))
  icon_fail "${STEP_NAME} END_IST=${end_iso} STEP_SEC=${step_sec} RESULT=FAIL"
  STEP_NAME=""
  STEP_START_EPOCH=0
  STEP_START_ISO=""
}

print_run_timing() {
  if [[ "${TIMING_PRINTED:-0}" == "1" ]]; then
    return 0
  fi
  TIMING_PRINTED=1
  local end_epoch end_iso total_sec
  end_epoch="$(date +%s)"
  end_iso="$(TZ=Asia/Kolkata date +%Y-%m-%dT%H:%M:%S%z)"
  total_sec=$(( end_epoch - RUN_START_EPOCH ))
  echo "== Script timing =="
  echo "START_IST=${RUN_START_ISO}"
  echo "END_IST=${end_iso}"
  echo "TOTAL_SEC=${total_sec}"
}

handle_interrupt() {
  print_run_timing
  exit 130
}

trap print_run_timing EXIT
trap handle_interrupt INT TERM

load_auth_token() {
  local from_file=""
  local from_env=""

  if [[ -f "$AUTH_TOKEN_FILE" ]]; then
    from_file="$(python3 - "$AUTH_TOKEN_FILE" <<'PY'
import json, sys
p = sys.argv[1]
raw = open(p, "r", encoding="utf-8").read().strip()
if not raw:
    print("")
    raise SystemExit(0)
try:
    obj = json.loads(raw)
    token = (obj.get("token") if isinstance(obj, dict) else "") or ""
    print(str(token).strip())
except Exception:
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip() and not ln.strip().startswith("#")]
    print(lines[0] if lines else "")
PY
)"
  fi

  if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
    from_env="$(python3 - <<'PY'
import json, os
raw = (os.environ.get("AUTH_BEARER_TOKEN") or "").strip()
if not raw:
    print("")
    raise SystemExit(0)
try:
    obj = json.loads(raw)
    token = (obj.get("token") if isinstance(obj, dict) else "") or ""
    print(str(token).strip())
except Exception:
    print(raw)
PY
)"
  fi

  if [[ "$TOKEN_FILE_PRIORITY" == "1" && -n "$from_file" ]]; then
    AUTH_BEARER_TOKEN="$from_file"
    TOKEN_SOURCE="file:${AUTH_TOKEN_FILE}"
  elif [[ -n "$from_env" ]]; then
    AUTH_BEARER_TOKEN="$from_env"
    TOKEN_SOURCE="env:AUTH_BEARER_TOKEN"
  elif [[ -n "$from_file" ]]; then
    AUTH_BEARER_TOKEN="$from_file"
    TOKEN_SOURCE="file:${AUTH_TOKEN_FILE}"
  else
    AUTH_BEARER_TOKEN=""
    TOKEN_SOURCE="unset"
  fi
}

rebuild_auth_header() {
  if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
    AUTH_HEADER_FLAG=(-H "Authorization: Bearer ${AUTH_BEARER_TOKEN}")
  else
    AUTH_HEADER_FLAG=("")
  fi
}

print_local_worker_diag() {
  local proc_line
  proc_line="$(pgrep -af 'worker.worker_loop' | head -n 1 || true)"
  if [[ -n "$proc_line" ]]; then
    echo "WORKER_UP=yes (${proc_line})"
  else
    echo "WORKER_UP=unknown (process lookup unavailable)"
  fi
  if [[ -f "$WORKER_LOG" ]]; then
    local targets_line
    targets_line="$(grep -m1 'QUEUE_TARGETS=' "$WORKER_LOG" || true)"
    if [[ -n "$targets_line" ]]; then
      echo "WORKER_QUEUE_TARGETS=${targets_line#*QUEUE_TARGETS=}"
      echo "WORKER_LOG_SIGNAL=present"
    else
      echo "WORKER_LOG_SIGNAL=missing"
    fi
  fi
}

check_local_worker_up() {
  local proc_line targets_line listen_line
  proc_line="$(pgrep -af 'worker.worker_loop' | head -n 1 || true)"
  if [[ -n "$proc_line" ]]; then
    echo "WORKER_UP=yes (${proc_line})"
  else
    echo "WORKER_UP=unknown (process lookup unavailable; falling back to worker log)"
  fi
  if [[ -f "$WORKER_LOG" ]]; then
    targets_line="$(grep -m1 'QUEUE_TARGETS=' "$WORKER_LOG" || true)"
    if [[ -n "$targets_line" ]]; then
      echo "WORKER_QUEUE_TARGETS=${targets_line#*QUEUE_TARGETS=}"
      if ! echo "$targets_line" | grep -q "$QUEUE_NAME"; then
        fail "Worker is up but not listening to local queue '${QUEUE_NAME}'."
      fi
      if [[ "$EXPECT_WORKER_BOTH_QUEUES" == "1" ]] && ! echo "$targets_line" | grep -q "$CLOUD_QUEUE_NAME"; then
        fail "Worker is up but not listening to cloud queue '${CLOUD_QUEUE_NAME}'. Start worker in QUEUE_MODE=both."
      fi
      return 0
    fi
    listen_line="$(grep -m1 'Listening on Redis queue:' "$WORKER_LOG" || true)"
    if [[ -n "$listen_line" ]]; then
      echo "WORKER_LISTEN=${listen_line#*Listening on Redis queue: }"
      if ! echo "$listen_line" | grep -q "$QUEUE_NAME"; then
        fail "Worker is up but listening to a different queue than '${QUEUE_NAME}'."
      fi
      return 0
    fi
  fi
  fail "Worker startup signal missing. Start it with scripts/start_local_stack.sh and check ${WORKER_LOG}."
}

fail() {
  end_step_fail
  maybe_print_diagnostics
  icon_fail "FAIL: $1"
  exit 1
}

trace() {
  [[ "$TRACE_FLOW" == "1" ]] || return 0
  echo "[TRACE] $1"
}

print_token_meta() {
  if [[ -z "$AUTH_BEARER_TOKEN" ]]; then
    echo "AUTH_TOKEN_META=missing"
    return 0
  fi
  python3 - "$AUTH_BEARER_TOKEN" <<'PY'
import base64, json, os, time, datetime
t = (os.environ.get("AUTH_BEARER_TOKEN") or "").strip()
if not t:
    import sys
    t = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
parts = t.split(".")
if len(parts) < 2:
    print("AUTH_TOKEN_META=invalid_jwt_format")
    raise SystemExit(0)
payload = parts[1] + "=" * (-len(parts[1]) % 4)
try:
    claims = json.loads(base64.urlsafe_b64decode(payload))
except Exception:
    print("AUTH_TOKEN_META=payload_decode_failed")
    raise SystemExit(0)
exp = claims.get("exp")
aud = claims.get("aud")
email = claims.get("email")
if isinstance(exp, (int, float)):
    now = int(time.time())
    rem = int(exp - now)
    exp_iso = datetime.datetime.utcfromtimestamp(exp).isoformat() + "Z"
    state = "expired" if rem <= 0 else "valid"
    print(f"AUTH_TOKEN_META=state={state} expires_utc={exp_iso} remaining_sec={rem} aud={aud} email={email}")
else:
    print(f"AUTH_TOKEN_META=state=unknown_exp aud={aud} email={email}")
PY
}

print_token_refresh_hint() {
  if [[ "${TOKEN_HINT_PRINTED:-0}" == "1" ]]; then
    return 0
  fi
  TOKEN_HINT_PRINTED=1
  echo "HINT: Token may be invalid/expired. Update AUTH_TOKEN_FILE=${AUTH_TOKEN_FILE} and retry."
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
  print_local_worker_diag
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
  if [[ -n "${CURRENT_JOB_ID:-}" ]]; then
    print_component_trace_local "$CURRENT_JOB_ID"
  fi
}

print_component_trace_local() {
  local job_id="$1"
  echo "== Functional trace (${job_id}) =="
  trace "1) UI -> API: upload request submitted by regression runner"
  trace "2) API -> Redis: job metadata + queue push expected"
  if command -v redis-cli >/dev/null 2>&1; then
    local status stage progress
    status="$(redis-cli -u "$REDIS_URL" HGET "job_status:${job_id}" status 2>/dev/null || true)"
    stage="$(redis-cli -u "$REDIS_URL" HGET "job_status:${job_id}" stage 2>/dev/null || true)"
    progress="$(redis-cli -u "$REDIS_URL" HGET "job_status:${job_id}" progress 2>/dev/null || true)"
    trace "3) Redis current state: status=${status:-n/a} stage=${stage:-n/a} progress=${progress:-n/a}"
  fi
  trace "4) Worker -> Redis: dequeue/process status updates"
  if [[ -f "$WORKER_LOG" ]]; then
    grep -n "$job_id" "$WORKER_LOG" | tail -n 12 || true
  fi
  trace "5) Worker -> Vertex/GCS: OCR/transcription + output upload"
  trace "6) API /status -> UI: surfaced status payload to client"
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
      print_token_refresh_hint
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
  local queued_warned="0"

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
        print_token_refresh_hint
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
      trace "${label}: API accepted upload and queued job in Redis"
      seen_queued="1"
    fi
    if [[ "$status" == "QUEUED" && "$elapsed" -ge 30 && "$queued_warned" == "0" ]]; then
      trace "${label}: still QUEUED after ${elapsed}s; worker may not be consuming queue=${QUEUE_NAME}"
      if command -v redis-cli >/dev/null 2>&1; then
        local q_depth_now
        q_depth_now="$(redis-cli -u "$REDIS_URL" LLEN "$QUEUE_NAME" 2>/dev/null || echo "n/a")"
        trace "${label}: queue depth snapshot queue=${QUEUE_NAME} depth=${q_depth_now}"
      fi
      queued_warned="1"
    fi
    if [[ "$status" == "PROCESSING" && "$seen_processing" == "0" ]]; then
      trace "${label}: Worker picked job and started processing (${stage})"
      seen_processing="1"
    fi

    if [[ "$status" == "COMPLETED" ]]; then
      if [[ "$seen_completed" == "0" ]]; then
        local out_path out_file
        out_path="$(echo "$resp" | jq -r '.output_path // "-"')"
        out_file="$(echo "$resp" | jq -r '.output_filename // "transcript.txt"')"
        trace "${label}: Worker completed, output uploaded to GCS path=${out_path}"
        trace "${label}: API returned completed status; output file=${out_file}"
        seen_completed="1"
      fi
      echo "Job ${job_id} completed"
      print_component_trace_local "$job_id"
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
  load_auth_token
  rebuild_auth_header

  local auth_set="no"
  if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
    auth_set="yes"
  fi
  begin_step "Local Regression: pre-checks"
  echo "API_BASE=${API_BASE}"
  echo "AUTH_BEARER_TOKEN set=${auth_set}"
  echo "AUTH_TOKEN_SOURCE=${TOKEN_SOURCE}"
  echo "AUTH_TOKEN_FILE=${AUTH_TOKEN_FILE}"
  print_token_meta
  require_file "$SAMPLE_PDF"
  require_file "$SAMPLE_MP3"
  if [[ "$REQUIRE_LOCAL_WORKER" == "1" ]]; then
    check_local_worker_up
  else
    print_local_worker_diag
  fi
  if [[ "$REQUIRE_AUTH" == "1" && -z "$AUTH_BEARER_TOKEN" ]]; then
    fail "AUTH_BEARER_TOKEN is required. Set env var or paste fresh token in ${AUTH_TOKEN_FILE}."
  fi
  api_health
  redis_health
  icon_ok "Pre-checks passed (API + Redis + worker)."
  trace "Precheck complete: UI/API/Worker/Redis ready for local regression flow"
  end_step_ok

  begin_step "OCR test (sample.pdf)"
  local ocr_resp ocr_job
  ocr_resp="$(submit_job "$SAMPLE_PDF" "OCR")"
  echo "OCR response: $ocr_resp"
  ocr_job="$(extract_job_id "$ocr_resp")"
  trace "OCR flow: UI -> API /upload -> job_id=${ocr_job}"
  poll_job "$ocr_job" "OCR"
  icon_ok "OCR regression step passed."
  end_step_ok

  begin_step "Transcription test (sample.mp3)"
  local tr_resp tr_job
  tr_resp="$(submit_job "$SAMPLE_MP3" "TRANSCRIPTION")"
  echo "Transcription response: $tr_resp"
  tr_job="$(extract_job_id "$tr_resp")"
  trace "Transcription flow: UI -> API /upload -> job_id=${tr_job}"
  poll_job "$tr_job" "TRANSCRIPTION"
  icon_ok "Transcription regression step passed."
  end_step_ok

  icon_ok "PASS: Local bounded regression completed"
  print_run_timing
}

main "$@"
