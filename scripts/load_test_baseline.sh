#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8090}"
AUTH_TOKEN_FILE="${AUTH_TOKEN_FILE:-/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/.auth_token.local}"
SAMPLE_PDF="${SAMPLE_PDF:-/Users/arpitjain/Downloads/Demo/sample.pdf}"
CONCURRENCY_LEVELS="${CONCURRENCY_LEVELS:-5 10}"
POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-2}"
MAX_WAIT_SEC="${MAX_WAIT_SEC:-300}"

extract_token() {
  python3 - "$AUTH_TOKEN_FILE" <<'PY'
import json, sys
raw = open(sys.argv[1], "r", encoding="utf-8").read().strip()
obj = json.loads(raw)
print((obj.get("token") or "").strip())
PY
}

require_file() {
  [[ -f "$1" ]] || { echo "Missing file: $1" >&2; exit 1; }
}

submit_one() {
  local req_id="$1"
  curl -sS -X POST "${API_BASE}/upload" \
    -H "Authorization: Bearer ${AUTH_BEARER_TOKEN}" \
    -H "X-Request-ID: ${req_id}" \
    -F "file=@${SAMPLE_PDF};type=application/pdf" \
    -F "type=OCR"
}

poll_done() {
  local job_id="$1"
  local deadline=$(( $(date +%s) + MAX_WAIT_SEC ))
  while [[ "$(date +%s)" -le "$deadline" ]]; do
    local payload status
    payload="$(curl -sS -H "Authorization: Bearer ${AUTH_BEARER_TOKEN}" "${API_BASE}/status/${job_id}")"
    status="$(echo "$payload" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("status",""))')"
    if [[ "$status" == "COMPLETED" || "$status" == "FAILED" || "$status" == "CANCELLED" ]]; then
      echo "$status"
      return 0
    fi
    sleep "$POLL_INTERVAL_SEC"
  done
  echo "TIMEOUT"
}

require_file "$SAMPLE_PDF"
AUTH_BEARER_TOKEN="$(extract_token)"
[[ -n "$AUTH_BEARER_TOKEN" ]] || { echo "Token missing in ${AUTH_TOKEN_FILE}" >&2; exit 1; }

echo "LOAD_TEST_BASELINE API_BASE=${API_BASE}"
echo "CONCURRENCY_LEVELS=${CONCURRENCY_LEVELS}"

for n in ${CONCURRENCY_LEVELS}; do
  echo "== Batch concurrency=${n} =="
  start="$(date +%s)"
  job_ids=()
  for i in $(seq 1 "$n"); do
    req_id="loadtest-${n}-${i}-$(date +%s)"
    resp="$(submit_one "$req_id")"
    jid="$(echo "$resp" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("job_id",""))')"
    [[ -n "$jid" ]] || { echo "submit_failed resp=$resp" >&2; continue; }
    job_ids+=("$jid")
  done
  completed=0; failed=0; cancelled=0; timeout=0
  for jid in "${job_ids[@]}"; do
    st="$(poll_done "$jid")"
    case "$st" in
      COMPLETED) completed=$((completed+1));;
      FAILED) failed=$((failed+1));;
      CANCELLED) cancelled=$((cancelled+1));;
      *) timeout=$((timeout+1));;
    esac
  done
  end="$(date +%s)"
  dur=$((end-start))
  echo "RESULT concurrency=${n} total=${#job_ids[@]} completed=${completed} failed=${failed} cancelled=${cancelled} timeout=${timeout} duration_sec=${dur}"
done
