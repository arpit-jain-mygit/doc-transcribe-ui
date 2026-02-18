#!/usr/bin/env bash
set -euo pipefail

# Cloud bounded regression runner.
# - Tests OCR upload with sample.pdf
# - Tests transcription upload with sample.mp3
# - Polls with hard deadlines (no indefinite wait)

API_BASE="${API_BASE:-https://doc-transcribe-api.onrender.com}"
CURL_BIN="${CURL_BIN:-/usr/bin/curl}"
LOG_DIR="${LOG_DIR:-/tmp/doc_transcribe_logs}"
API_LOG="${API_LOG:-${LOG_DIR}/api.log}"
WORKER_LOG="${WORKER_LOG:-/tmp/doc_transcribe_logs/worker.log}"
UI_LOG="${UI_LOG:-${LOG_DIR}/ui.log}"
REGRESSION_LOG_FILE="${REGRESSION_LOG_FILE:-${LOG_DIR}/regression-cloud-$(date +%Y%m%d-%H%M%S).log}"
INTEGRATION_REPORT_FILE="${INTEGRATION_REPORT_FILE:-${LOG_DIR}/integration-cloud-$(date +%Y%m%d-%H%M%S).jsonl}"
CLOUD_QUEUE_NAME="${CLOUD_QUEUE_NAME:-doc_jobs}"
REQUIRE_LOCAL_WORKER="${REQUIRE_LOCAL_WORKER:-1}"
REQUIRE_WORKER_LOG_CORRELATION="${REQUIRE_WORKER_LOG_CORRELATION:-0}"
RUN_INTAKE_PRECHECK_ASSERT="${RUN_INTAKE_PRECHECK_ASSERT:-1}"

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
MAX_WAIT_SEC="${MAX_WAIT_SEC:-300}"
POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-3}"
LOG_EVERY_SEC="${LOG_EVERY_SEC:-10}"
TRACE_FLOW="${TRACE_FLOW:-1}"
CORRELATION_WAIT_SEC="${CORRELATION_WAIT_SEC:-8}"
MAX_UPLOAD_ATTEMPTS="${MAX_UPLOAD_ATTEMPTS:-2}"
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

setup_script_logging() {
  if [[ "${SCRIPT_LOG_SETUP:-0}" == "1" ]]; then
    return 0
  fi
  SCRIPT_LOG_SETUP=1
  mkdir -p "$LOG_DIR"
  exec > >(tee -a "$REGRESSION_LOG_FILE") 2>&1
}

print_log_paths() {
  echo "== Log paths =="
  echo "API_LOG=${API_LOG}"
  echo "WORKER_LOG=${WORKER_LOG}"
  echo "UI_LOG=${UI_LOG}"
  echo "REGRESSION_LOG=${REGRESSION_LOG_FILE}"
  echo "INTEGRATION_REPORT=${INTEGRATION_REPORT_FILE}"
}

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

append_status_sequence() {
  local current="$1"
  local next_status="$2"
  if [[ -z "$next_status" ]]; then
    echo "$current"
    return 0
  fi
  if [[ -z "$current" ]]; then
    echo "$next_status"
    return 0
  fi
  local last="${current##*,}"
  if [[ "$last" == "$next_status" ]]; then
    echo "$current"
    return 0
  fi
  echo "${current},${next_status}"
}

assert_lifecycle_sequence() {
  local label="$1"
  local sequence="$2"
  local terminal="$3"
  [[ -n "$sequence" ]] || fail "${label} lifecycle sequence is empty"
  [[ "$sequence" == *"$terminal"* ]] || fail "${label} lifecycle missing terminal status ${terminal}: ${sequence}"
  if [[ "$sequence" == *"FAILED"* && "$terminal" != "FAILED" ]]; then
    fail "${label} lifecycle contains FAILED before success path: ${sequence}"
  fi
  if [[ "$sequence" == *"CANCELLED"* && "$terminal" != "CANCELLED" ]]; then
    fail "${label} lifecycle contains CANCELLED before success path: ${sequence}"
  fi
  if [[ "$sequence" != *"QUEUED"* && "$sequence" != *"PROCESSING"* && "$sequence" != "COMPLETED" ]]; then
    fail "${label} lifecycle does not show expected processing states: ${sequence}"
  fi
  trace "${label}: lifecycle certified sequence=${sequence}"
}

append_integration_report() {
  local scenario="$1"
  local job_id="$2"
  local request_id="$3"
  local sequence="$4"
  local duration_sec="$5"
  local result="$6"
  python3 - "$INTEGRATION_REPORT_FILE" "$scenario" "$job_id" "$request_id" "$sequence" "$duration_sec" "$result" <<'PY'
import json
import sys
from datetime import datetime, timezone

report_file, scenario, job_id, request_id, sequence, duration_sec, result = sys.argv[1:]
entry = {
    "ts_utc": datetime.now(timezone.utc).isoformat(),
    "env": "cloud",
    "scenario": scenario,
    "job_id": job_id,
    "request_id": request_id,
    "status_sequence": sequence.split(",") if sequence else [],
    "duration_sec": int(float(duration_sec or 0)),
    "result": result,
}
with open(report_file, "a", encoding="utf-8") as f:
    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
PY
}

print_local_worker_diag() {
  local proc_line targets_line
  proc_line="$(pgrep -af 'worker.worker_loop' | head -n 1 || true)"
  if [[ -n "$proc_line" ]]; then
    echo "LOCAL_WORKER_UP=yes (${proc_line})"
  else
    echo "LOCAL_WORKER_UP=unknown (process lookup unavailable)"
  fi
  if [[ -f "$WORKER_LOG" ]]; then
    targets_line="$(grep -m1 'QUEUE_TARGETS=' "$WORKER_LOG" || true)"
    if [[ -n "$targets_line" ]]; then
      echo "LOCAL_WORKER_QUEUE_TARGETS=${targets_line#*QUEUE_TARGETS=}"
      echo "LOCAL_WORKER_LOG_SIGNAL=present"
    else
      echo "LOCAL_WORKER_LOG_SIGNAL=missing"
    fi
  fi
}

check_local_worker_for_cloud() {
  local proc_line targets_line listen_line
  proc_line="$(pgrep -af 'worker.worker_loop' | head -n 1 || true)"
  if [[ -n "$proc_line" ]]; then
    echo "LOCAL_WORKER_UP=yes (${proc_line})"
  else
    echo "LOCAL_WORKER_UP=unknown (process lookup unavailable; falling back to worker log)"
  fi

  if [[ -f "$WORKER_LOG" ]]; then
    targets_line="$(grep -m1 'QUEUE_TARGETS=' "$WORKER_LOG" || true)"
    if [[ -n "$targets_line" ]]; then
      echo "LOCAL_WORKER_QUEUE_TARGETS=${targets_line#*QUEUE_TARGETS=}"
      if ! echo "$targets_line" | grep -q "$CLOUD_QUEUE_NAME"; then
        fail "Local worker is up but not listening to cloud queue '${CLOUD_QUEUE_NAME}'. Update worker queue config."
      fi
      return 0
    fi

    listen_line="$(grep -m1 'Listening on Redis queue:' "$WORKER_LOG" || true)"
    if [[ -n "$listen_line" ]]; then
      echo "LOCAL_WORKER_LISTEN=${listen_line#*Listening on Redis queue: }"
      if ! echo "$listen_line" | grep -q "$CLOUD_QUEUE_NAME"; then
        fail "Local worker is up but listening to a different queue than '${CLOUD_QUEUE_NAME}'."
      fi
      return 0
    fi
  else
    trace "Worker log not found at ${WORKER_LOG}; queue target check skipped."
  fi
  fail "Local worker startup signal missing. Start with scripts/start_local_stack.sh and check ${WORKER_LOG}."
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
    rem_min = rem // 60
    exp_iso = datetime.datetime.utcfromtimestamp(exp).isoformat() + "Z"
    state = "expired" if rem <= 0 else "valid"
    print(f"AUTH_TOKEN_META=state={state} expires_utc={exp_iso} remaining_sec={rem} remaining_min={rem_min} aud={aud} email={email}")
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
  echo "How to get a fresh token from browser:"
  echo "1) Open the UI and sign in: https://doc-transcribe-ui.vercel.app/"
  echo "2) Open browser DevTools (F12) -> Console."
  echo "3) Run: JSON.stringify({ token: window.ID_TOKEN, email: window.USER_EMAIL, picture: window.USER_PICTURE })"
  echo "4) Copy output JSON into: ${AUTH_TOKEN_FILE}"
  echo "5) Re-run regression script."
}

print_cloud_worker_pickup_diagnosis() {
  local job_id="$1"
  local elapsed="$2"
  local status_payload="$3"
  local status stage progress created updated
  status="$(echo "$status_payload" | jq -r '.status // "-"' 2>/dev/null || echo "-")"
  stage="$(echo "$status_payload" | jq -r '.stage // "-"' 2>/dev/null || echo "-")"
  progress="$(echo "$status_payload" | jq -r '.progress // "-"' 2>/dev/null || echo "-")"
  created="$(echo "$status_payload" | jq -r '.created_at // "-"' 2>/dev/null || echo "-")"
  updated="$(echo "$status_payload" | jq -r '.updated_at // "-"' 2>/dev/null || echo "-")"
  if [[ "$status" == "QUEUED" && "$progress" == "0" && "$created" != "-" && "$created" == "$updated" ]]; then
    trace "Worker pickup signal: NO (job ${job_id} stayed QUEUED ${elapsed}s; created_at == updated_at)."
    trace "Likely cause: cloud worker down, wrong Redis, or QUEUE_NAME mismatch."
  else
    trace "Worker pickup signal: YES/UNKNOWN (status=${status} stage=${stage} progress=${progress})."
  fi
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
  print_local_worker_diag
  if [[ -n "${CURRENT_JOB_ID:-}" ]]; then
    local status_payload
    status_payload="$(safe_get "${API_BASE}/status/${CURRENT_JOB_ID}")"
    echo "status(${CURRENT_JOB_ID}): ${status_payload}"
    print_cloud_worker_pickup_diagnosis "${CURRENT_JOB_ID}" "timeout" "${status_payload}"
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

check_render_deploy_state() {
  local tries="${1:-3}"
  local sleep_sec="${2:-2}"
  local i body code version

  for i in $(seq 1 "$tries"); do
    code="$("$CURL_BIN" -sS -o /tmp/render_health_body.$$ -w "%{http_code}" "${API_BASE}/health" 2>/dev/null || echo "000")"
    rm -f /tmp/render_health_body.$$ >/dev/null 2>&1 || true
    if [[ "$code" == "200" ]]; then
      trace "Render readiness check ${i}/${tries}: /health=200 (API reachable)."
    elif [[ "$code" =~ ^(000|429|500|502|503|504)$ ]]; then
      trace "Render readiness check ${i}/${tries}: /health=${code} (deployment/cold-start/or transient infra issue likely)."
      sleep "$sleep_sec"
      continue
    else
      trace "Render readiness check ${i}/${tries}: /health=${code} (unexpected status, continuing checks)."
    fi

    body="$(safe_get "${API_BASE}/contract/job-status")"
    if [[ -z "$body" ]]; then
      trace "Render contract check ${i}/${tries}: no response from /contract/job-status (API may still be warming/deploying)."
      sleep "$sleep_sec"
      continue
    fi

    version="$(echo "$body" | jq -r '.contract_version // empty' 2>/dev/null || true)"
    if [[ -z "$version" ]]; then
      trace "Render contract check ${i}/${tries}: non-JSON/invalid response (deployment may be in progress)."
      sleep "$sleep_sec"
      continue
    fi

    trace "Render contract check: ready (contract_version=${version})."
    return 0
  done

  trace "Render deploy status: API not fully ready yet (or still warming/deploying). Proceeding with regression may fail transiently."
  return 0
}

generate_request_id() {
  local kind="${1:-GEN}"
  local rid
  rid="$(python3 - "$kind" <<'PY'
import sys, uuid
kind = (sys.argv[1] if len(sys.argv) > 1 else "GEN").strip().upper()
print(f"req-{kind}-{uuid.uuid4().hex}")
PY
)"
  [[ -n "$rid" ]] || fail "Could not generate request_id"
  echo "$rid"
}

# User value: verifies Smart Intake precheck guidance before upload so users get early routing/ETA clarity.
run_intake_precheck_assertion() {
  local file_path="$1"
  local expected_job_type="$2"
  local req_id="$3"
  [[ "$RUN_INTAKE_PRECHECK_ASSERT" == "1" ]] || return 0

  local mime_type filename payload result code body actual_job
  filename="$(basename "$file_path")"
  case "${filename##*.}" in
    pdf|PDF) mime_type="application/pdf" ;;
    mp3|MP3) mime_type="audio/mpeg" ;;
    *) mime_type="application/octet-stream" ;;
  esac
  payload="$(python3 - "$filename" "$mime_type" <<'PY'
import json, sys
print(json.dumps({
  "filename": sys.argv[1],
  "mime_type": sys.argv[2],
}))
PY
)"

  if [[ -n "${AUTH_HEADER_FLAG[0]}" ]]; then
    result="$(http_call POST "${API_BASE}/intake/precheck" \
      "${AUTH_HEADER_FLAG[@]}" \
      -H "X-Request-ID: ${req_id}" \
      -H "Content-Type: application/json" \
      -d "$payload")"
  else
    result="$(http_call POST "${API_BASE}/intake/precheck" \
      -H "X-Request-ID: ${req_id}" \
      -H "Content-Type: application/json" \
      -d "$payload")"
  fi
  code="$(echo "$result" | sed -n '1p')"
  body="$(echo "$result" | sed -n '2,$p')"

  if [[ "$code" == "404" ]]; then
    trace "Intake precheck skipped: feature disabled on API"
    return 0
  fi
  if [[ ! "$code" =~ ^2 ]]; then
    fail "Intake precheck assertion failed (HTTP ${code}): ${body}"
  fi

  actual_job="$(echo "$body" | jq -r '.detected_job_type // empty')"
  [[ -n "$actual_job" ]] || fail "Intake precheck missing detected_job_type: ${body}"
  [[ "$actual_job" == "$expected_job_type" ]] || fail "Intake route mismatch: expected=${expected_job_type} actual=${actual_job}"
  echo "$body" | jq -e '.warnings and .reasons and (.eta_sec | type == "number") and (.confidence | type == "number")' >/dev/null \
    || fail "Intake precheck payload missing expected fields: ${body}"
  trace "Intake precheck certified route=${actual_job} eta_sec=$(echo "$body" | jq -r '.eta_sec') warnings=$(echo "$body" | jq -r '.warnings | length')"
}

submit_job() {
  local file_path="$1"
  local job_type="$2"
  local req_id="${3:-}"
  local idem_key="${4:-}"
  local ext mime_override file_form
  if [[ -z "$req_id" ]]; then
    req_id="$(generate_request_id "$job_type")"
  fi
  if [[ -z "$idem_key" ]]; then
    idem_key="$(python3 - "$job_type" "$(basename "$file_path")" "$req_id" <<'PY'
import hashlib, sys
job_type = sys.argv[1]
name = sys.argv[2]
req_id = sys.argv[3]
print(hashlib.sha1(f"{job_type}|{name}|{req_id}".encode("utf-8")).hexdigest())
PY
)"
  fi
  ext="${file_path##*.}"
  ext="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"
  mime_override=""
  case "$ext" in
    mp3) mime_override="audio/mpeg" ;;
    pdf) mime_override="application/pdf" ;;
  esac
  if [[ -n "$mime_override" ]]; then
    file_form="file=@${file_path};type=${mime_override}"
  else
    file_form="file=@${file_path}"
  fi
  local result code body attempt
  attempt=1
  while true; do
    if [[ -n "${AUTH_HEADER_FLAG[0]}" ]]; then
      result="$(http_call POST "${API_BASE}/upload" \
        "${AUTH_HEADER_FLAG[@]}" \
        -H "X-Request-ID: ${req_id}" \
        -H "X-Idempotency-Key: ${idem_key}" \
        -F "${file_form}" \
        -F "type=${job_type}")"
    else
      result="$(http_call POST "${API_BASE}/upload" \
        -H "X-Request-ID: ${req_id}" \
        -H "X-Idempotency-Key: ${idem_key}" \
        -F "${file_form}" \
        -F "type=${job_type}")"
    fi
    code="$(echo "$result" | sed -n '1p')"
    body="$(echo "$result" | sed -n '2,$p')"
    if [[ "$code" =~ ^2 ]]; then
      break
    fi
    if [[ "$code" =~ ^(502|503|504)$ && "$attempt" -lt "$MAX_UPLOAD_ATTEMPTS" ]]; then
      trace "${job_type}: transient upload error HTTP ${code}; retrying attempt $((attempt + 1))/${MAX_UPLOAD_ATTEMPTS}"
      attempt=$((attempt + 1))
      sleep 2
      continue
    fi
    break
  done
  if [[ ! "$code" =~ ^2 ]]; then
    if [[ "$code" == "401" ]]; then
      print_token_refresh_hint
      fail "Upload request failed for ${job_type} (HTTP 401). Token likely expired/invalid. Body: ${body}"
    fi
    fail "Upload request failed for ${job_type} (HTTP ${code}): ${body}"
  fi
  trace "${job_type}: request_id sent=${req_id}" >&2
  echo "$body"
}

extract_job_id() {
  local resp="$1"
  local job_id
  job_id="$(echo "$resp" | jq -r '.job_id // empty')"
  [[ -n "$job_id" ]] || fail "Could not extract job_id from response: $resp"
  echo "$job_id"
}

extract_request_id() {
  local resp="$1"
  local request_id
  request_id="$(echo "$resp" | jq -r '.request_id // empty')"
  [[ -n "$request_id" ]] || fail "Missing request_id in upload response: $resp"
  echo "$request_id"
}

assert_request_id_match() {
  local source="$1"
  local expected="$2"
  local actual="$3"
  if [[ -z "$actual" ]]; then
    fail "CORRELATION_ID_MISSING at ${source}: expected=${expected} actual=empty"
  fi
  if [[ "$expected" != "$actual" ]]; then
    fail "CORRELATION_ID_MISMATCH at ${source}: expected=${expected} actual=${actual}"
  fi
}

require_non_empty() {
  local value="$1"
  local label="$2"
  if [[ -z "$value" ]]; then
    fail "${label} is empty"
  fi
}

certify_worker_log_correlation() {
  local job_id="$1"
  local request_id="$2"
  if [[ "$REQUIRE_WORKER_LOG_CORRELATION" != "1" ]]; then
    trace "Correlation(Worker): skipped strict worker-log certification (REQUIRE_WORKER_LOG_CORRELATION=0)."
    return 0
  fi
  local wait_until=$(( $(date +%s) + CORRELATION_WAIT_SEC ))
  while [[ "$(date +%s)" -le "$wait_until" ]]; do
    if [[ -f "$WORKER_LOG" ]] && grep -F "$job_id" "$WORKER_LOG" | grep -Fq "$request_id"; then
      trace "Correlation(Worker): certified request_id=${request_id} for job_id=${job_id}"
      return 0
    fi
    sleep 1
  done
  fail "CORRELATION_ID_MISSING in worker logs for job_id=${job_id} request_id=${request_id}. Active worker may not be writing to WORKER_LOG=${WORKER_LOG}. Start via start_local_stack.sh or set WORKER_LOG to your manual worker log file."
}

poll_job() {
  local job_id="$1"
  local label="$2"
  local expected_request_id="$3"
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
  local status_sequence=""

  while true; do
    local now
    now="$(date +%s)"
    [[ "$now" -le "$deadline" ]] || fail "Timeout waiting for ${label} job ${job_id} (>${MAX_WAIT_SEC}s). Last status payload: ${last_resp}"

    local result code resp status stage progress elapsed request_id
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
    request_id="$(echo "$resp" | jq -r '.request_id // empty')"
    assert_request_id_match "status(${job_id})" "$expected_request_id" "$request_id"
    elapsed=$(( now - started_at ))

    if [[ "$status" != "$last_status" || $(( now - last_log_at )) -ge "$LOG_EVERY_SEC" ]]; then
      echo "[${label}] t+${elapsed}s request_id=${request_id} status=${status:-UNKNOWN} stage=${stage} progress=${progress}"
      last_log_at="$now"
      last_status="$status"
    fi
    status_sequence="$(append_status_sequence "$status_sequence" "$status")"

    if [[ "$status" == "QUEUED" && "$seen_queued" == "0" ]]; then
      trace "${label}: API accepted and queued job"
      seen_queued="1"
    fi
    if [[ "$status" == "QUEUED" && "$elapsed" -ge 30 && "$queued_warned" == "0" ]]; then
      print_cloud_worker_pickup_diagnosis "$job_id" "$elapsed" "$resp"
      queued_warned="1"
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
      certify_worker_log_correlation "$job_id" "$expected_request_id"
      assert_lifecycle_sequence "$label" "$status_sequence" "COMPLETED"
      LAST_STATUS_SEQUENCE="$status_sequence"
      LAST_JOB_DURATION_SEC="$elapsed"
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
  setup_script_logging
  : > "$INTEGRATION_REPORT_FILE"
  load_auth_token
  rebuild_auth_header

  local auth_set="no"
  if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
    auth_set="yes"
  fi
  begin_step "Cloud Regression: pre-checks"
  print_log_paths
  echo "API_BASE=${API_BASE}"
  echo "AUTH_BEARER_TOKEN set=${auth_set}"
  echo "AUTH_TOKEN_SOURCE=${TOKEN_SOURCE}"
  echo "AUTH_TOKEN_FILE=${AUTH_TOKEN_FILE}"
  print_token_meta
  require_file "$SAMPLE_PDF"
  require_file "$SAMPLE_MP3"
  if [[ "$REQUIRE_AUTH" == "1" && -z "$AUTH_BEARER_TOKEN" ]]; then
    fail "AUTH_BEARER_TOKEN is required. Set env var or paste fresh token in ${AUTH_TOKEN_FILE}."
  fi
  if [[ "$REQUIRE_LOCAL_WORKER" == "1" ]]; then
    check_local_worker_for_cloud
  fi
  api_health
  check_render_deploy_state 4 2
  icon_ok "Pre-checks passed (cloud API + local worker readiness)."
  trace "Precheck complete: cloud API reachable"
  end_step_ok

  begin_step "OCR test (sample.pdf)"
  local ocr_resp ocr_job
  local ocr_req_id=""
  ocr_req_id="$(generate_request_id "OCR")"
  require_non_empty "${ocr_req_id:-}" "ocr_req_id"
  run_intake_precheck_assertion "$SAMPLE_PDF" "OCR" "$ocr_req_id"
  ocr_resp="$(submit_job "$SAMPLE_PDF" "OCR" "$ocr_req_id")"
  echo "OCR response: $ocr_resp"
  ocr_job="$(extract_job_id "$ocr_resp")"
  assert_request_id_match "upload(OCR)" "$ocr_req_id" "$(extract_request_id "$ocr_resp")"
  trace "OCR flow: UI -> API /upload -> job_id=${ocr_job} request_id=${ocr_req_id}"
  poll_job "$ocr_job" "OCR" "$ocr_req_id"
  append_integration_report "OCR" "$ocr_job" "$ocr_req_id" "${LAST_STATUS_SEQUENCE:-}" "${LAST_JOB_DURATION_SEC:-0}" "PASS"
  icon_ok "OCR regression step passed."
  end_step_ok

  begin_step "Transcription test (sample.mp3)"
  local tr_resp tr_job
  local tr_req_id=""
  tr_req_id="$(generate_request_id "TRANSCRIPTION")"
  require_non_empty "${tr_req_id:-}" "tr_req_id"
  run_intake_precheck_assertion "$SAMPLE_MP3" "TRANSCRIPTION" "$tr_req_id"
  tr_resp="$(submit_job "$SAMPLE_MP3" "TRANSCRIPTION" "$tr_req_id")"
  echo "Transcription response: $tr_resp"
  tr_job="$(extract_job_id "$tr_resp")"
  assert_request_id_match "upload(TRANSCRIPTION)" "$tr_req_id" "$(extract_request_id "$tr_resp")"
  trace "Transcription flow: UI -> API /upload -> job_id=${tr_job} request_id=${tr_req_id}"
  poll_job "$tr_job" "TRANSCRIPTION" "$tr_req_id"
  append_integration_report "TRANSCRIPTION" "$tr_job" "$tr_req_id" "${LAST_STATUS_SEQUENCE:-}" "${LAST_JOB_DURATION_SEC:-0}" "PASS"
  icon_ok "Transcription regression step passed."
  end_step_ok

  icon_ok "PASS: Cloud bounded regression completed"
  icon_ok "Integration report written: ${INTEGRATION_REPORT_FILE}"
  print_run_timing
}

main "$@"
