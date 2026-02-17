# Release Notes (`doc-transcribe-ui`)

This file tracks release-level changes with backlog traceability.

## Entry format (use for every backlog item)
- `Backlog ID`: `PRS-xxx`
- `Type`: `Feature` | `Refactor` | `Fix` | `Docs` | `NFR`
- `Summary`: one-line description
- `Why`: problem solved
- `Files`: key files changed
- `Risk`: `Low` | `Medium` | `High`
- `Validation`: what was tested
- `Status`: `Completed (Code)` | `Completed (Tested)`

---

## Unreleased

### PRS-001
- Backlog ID: `PRS-001`
- Backlog Link: [PRS-001](./PRODUCTION_READINESS_BACKLOG.md#prs-001)
- Gap Link: [G-01](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-01)
- Type: `NFR` + `Docs`
- Summary: Formalized architecture boundaries and contribution standards for UI repo.
- Why: Improve maintainability and onboarding consistency for new engineers.
- Files:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/ARCHITECTURE.md`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/CONTRIBUTING.md`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/README.md`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/PRODUCTION_READINESS_BACKLOG.md`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/CURRENT_STATE_AND_GAP_ANALYSIS.md`
- Risk: `Low`
- Validation:
  - Document structure and links verified.
  - Backlog and gap status alignment updated (`PRS-001`, `G-01`).
  - Local regression passed (OCR + transcription).
  - Cloud regression passed (user-run confirmation).
- Status: `Completed (Tested)`

### PRS-002
- Backlog ID: `PRS-002`
- Backlog Link: [PRS-002](./PRODUCTION_READINESS_BACKLOG.md#prs-002)
- Gap Link: [G-02](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-02)
- Type: `NFR` + `Docs`
- Summary: Added canonical job/status field contract across UI/API/Worker with API as source of truth.
- Why: Remove field-name drift risk and stabilize lifecycle metadata usage.
- Files:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/JOB_STATUS_CONTRACT.md`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/job-contract.js`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/JOB_STATUS_CONTRACT.md`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/job_contract.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/contract.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/JOB_STATUS_CONTRACT.md`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/contract.py`
- Risk: `Low`
- Validation:
  - API contract endpoint available (`GET /contract/job-status`).
  - UI field reads moved to canonical resolver helper.
  - Local regression passed (OCR + transcription).
  - Cloud regression passed (user-run confirmation).
- Status: `Completed (Tested)`

### PRS-003
- Backlog ID: `PRS-003`
- Backlog Link: [PRS-003](./PRODUCTION_READINESS_BACKLOG.md#prs-003)
- Gap Link: [G-03](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-03)
- Type: `NFR` + `Fix`
- Summary: Standardized error codes/messages to remove ambiguity in failed jobs.
- Why: Reduce confusion from raw/unstable exception text and make failures actionable.
- Files:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/utils.js`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/polling.js`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/status.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/error_catalog.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/worker_loop.py`
- Risk: `Low`
- Validation:
  - Worker now writes canonical failed/cancelled error fields.
  - API status normalizes missing failure fields.
  - UI and regression scripts show standardized error messages.
  - Local regression passed (OCR + transcription).
  - Cloud regression passed (user-run confirmation).
- Status: `Completed (Tested)`

### PRS-004
- Backlog ID: `PRS-004`
- Backlog Link: [PRS-004](./PRODUCTION_READINESS_BACKLOG.md#prs-004)
- Type: `NFR` + `Reliability`
- Summary: Added fail-fast startup environment validation in API and Worker.
- Why: Catch missing/invalid configuration at boot instead of failing during live job processing.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/startup_env.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/app.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/startup_env.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/worker_loop.py`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
- Risk: `Low`
- Validation:
  - Local regression passed (OCR + transcription completed).
  - Cloud regression passed (OCR + transcription completed).
  - Startup logs confirmed validator success and warning surfaces.
- Status: `Completed (Tested)`

### PRS-005
- Backlog ID: `PRS-005`
- Backlog Link: [PRS-005](./PRODUCTION_READINESS_BACKLOG.md#prs-005)
- Type: `NFR` + `Observability`
- Summary: Added end-to-end correlation ID (`request_id`) propagation across UI/API/Worker.
- Why: Enable single-request traceability across upload, queueing, processing, and status polling.
- Files:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/api.js`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/app.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/upload.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/worker_loop.py`
- Risk: `Low`
- Validation:
  - Local regression passed (OCR + transcription).
  - Cloud regression passed (OCR + transcription).
  - Upload and status payloads include matching `request_id`.
- Status: `Completed (Tested)`

### PRS-006
- Backlog ID: `PRS-006`
- Backlog Link: [PRS-006](./PRODUCTION_READINESS_BACKLOG.md#prs-006)
- Type: `NFR` + `Observability`
- Summary: Enforced structured JSON logging with mandatory fields for API and Worker.
- Why: Improve production troubleshooting with machine-parseable logs and consistent event keys.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/logging_config.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/upload.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/status.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/worker_loop.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/transcribe.py`
- Risk: `Low`
- Validation:
  - Local regression passed (OCR + transcription).
  - Cloud regression passed (OCR + transcription).
  - Structured logs verified for stage START/COMPLETED/FAILED events.
- Status: `Completed (Tested)`

### PRS-007
- Backlog ID: `PRS-007`
- Backlog Link: [PRS-007](./PRODUCTION_READINESS_BACKLOG.md#prs-007)
- Type: `NFR` + `Monitoring`
- Summary: Added operational metrics for API/Worker (success/fail/retry/latency).
- Why: Improve proactive detection of degraded behavior and failure hotspots.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/utils/metrics.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/health.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/metrics.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/utils/gcs.py`
- Risk: `Low`
- Validation:
  - Local regression passed (OCR + transcription).
  - Cloud regression passed (OCR + transcription).
  - Metrics counters/latency recorded for API request path and worker dispatch/GCS operations.
- Status: `Completed (Tested)`

### PRS-008
- Backlog ID: `PRS-008`
- Backlog Link: [PRS-008](./PRODUCTION_READINESS_BACKLOG.md#prs-008)
- Type: `NFR` + `Reliability`
- Summary: Enforced job status transition state machine in API and Worker.
- Why: Prevent invalid lifecycle transitions and improve consistency across queued/processing/terminal states.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/utils/status_machine.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/upload.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/jobs.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/status_machine.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/worker_loop.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/ocr.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/transcribe.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/dispatcher.py`
- Risk: `Medium`
- Validation:
  - Syntax/compile checks passed for touched Python modules.
  - Local regression passed (user-run confirmation).
  - Cloud regression passed (user-run confirmation).
- Commits:
  - API: `d2f8afb`
  - Worker: `021542f`
- Status: `Completed (Tested)`

### PRS-009
- Backlog ID: `PRS-009`
- Backlog Link: [PRS-009](./PRODUCTION_READINESS_BACKLOG.md#prs-009)
- Type: `NFR` + `Reliability`
- Summary: Added upload idempotency key support with duplicate job reuse.
- Why: Prevent duplicate job creation during client retry/network glitches.
- Files:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/upload.js`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/upload.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/job_contract.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/contract.py`
- Risk: `Medium`
- Validation:
  - Local regression passed (user-run confirmation).
  - Cloud regression passed (user-run confirmation).
  - Upload response includes idempotency reuse behavior (`reused` flag) without duplicate queue pushes.
- Commits:
  - UI: `74c1ec1`
  - API: `ab5f3cb`
  - Worker: `7b0d273`
- Status: `Completed (Tested)`

### PRS-010
- Backlog ID: `PRS-010`
- Backlog Link: [PRS-010](./PRODUCTION_READINESS_BACKLOG.md#prs-010)
- Gap Link: [G-10](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-10)
- Type: `NFR` + `Reliability`
- Summary: Added typed retry policy with bounded backoff + jitter in worker retry paths.
- Why: Improve resilience for transient Redis/GCS failures while avoiding retry storms.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/utils/retry_policy.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/utils/gcs.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/cancel.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/ocr.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/transcribe.py`
- Risk: `Medium`
- Validation:
  - Local regression passed (user-run confirmation).
  - Cloud regression passed (user-run confirmation).
  - Worker retry logs now show typed policy + backoff/jitter attempts.
- Commit:
  - Worker: `edaf8c8`
- Status: `Completed (Tested)`

### PRS-011
- Backlog ID: `PRS-011`
- Backlog Link: [PRS-011](./PRODUCTION_READINESS_BACKLOG.md#prs-011)
- Gap Link: [G-11](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-11)
- Type: `NFR` + `Recoverability`
- Summary: Enriched DLQ payload with replay/debug metadata (`error_code`, `attempts`, failed stage, queue/source, worker identity).
- Why: Make failed-job diagnosis and replay deterministic without manual log correlation.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/dead_letter.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/worker_loop.py`
- Risk: `Low`
- Validation:
  - Python compile checks passed for touched worker modules.
  - Local regression passed (user-run confirmation).
  - Cloud regression passed (user-run confirmation).
- Commit:
  - Worker: `29c44d4`
- Status: `Completed (Tested)`

### PRS-012
- Backlog ID: `PRS-012`
- Backlog Link: [PRS-012](./PRODUCTION_READINESS_BACKLOG.md#prs-012)
- Gap Link: [G-12](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-12)
- Type: `NFR` + `Error consistency`
- Summary: Standardized API global exception mapping for HTTP, validation, and unhandled errors.
- Why: Ensure clients always receive a predictable error structure and normalized error codes.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/app.py`
- Risk: `Low`
- Validation:
  - Python compile check passed for API app handler changes.
  - Local regression passed (user-run confirmation).
  - Cloud regression passed (user-run confirmation).
- Commit:
  - API: `8a81134`
- Status: `Completed (Tested)`

### PRS-013
- Backlog ID: `PRS-013`
- Backlog Link: [PRS-013](./PRODUCTION_READINESS_BACKLOG.md#prs-013)
- Gap Link: [G-13](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-13)
- Type: `NFR` + `Security`
- Summary: Tightened Google token validation (`iss`, `aud`, `azp`, expiry timing) with normalized auth error codes.
- Why: Prevent token acceptance ambiguity and make auth failures deterministic for UI and ops.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/auth.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/auth.py`
- Risk: `Medium`
- Validation:
  - Python compile checks passed for touched API auth modules.
  - Local regression passed (user-run confirmation).
  - Cloud regression passed (user-run confirmation).
- Commit:
  - API: `8a81134`
- Status: `Completed (Tested)`

### PRS-014
- Backlog ID: `PRS-014`
- Backlog Link: [PRS-014](./PRODUCTION_READINESS_BACKLOG.md#prs-014)
- Gap Link: [G-13](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-13)
- Type: `NFR` + `Security`
- Summary: Enforced strict environment-based CORS allowlist and startup validation.
- Why: Remove CORS drift and avoid implicit broad origin acceptance across environments.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/app.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/startup_env.py`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/start_local_stack.sh`
- Risk: `Medium`
- Validation:
  - Python compile checks passed for touched API CORS/startup modules.
  - Local regression passed (user-run confirmation).
  - Cloud regression passed (user-run confirmation).
- Commit:
  - API: `c43bd1d`
- Status: `Completed (Tested)`

### PRS-015
- Backlog ID: `PRS-015`
- Backlog Link: [PRS-015](./PRODUCTION_READINESS_BACKLOG.md#prs-015)
- Gap Link: [G-13](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-13)
- Type: `NFR` + `Security and validation`
- Summary: Added strict server-side upload validation for extension, MIME type, and file size.
- Why: Reject unsupported files early and avoid late worker failures for invalid payloads.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/upload.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/startup_env.py`
- Risk: `Medium`
- Validation:
  - Python compile checks passed for touched upload/startup modules.
  - Local regression passed (user-run confirmation).
  - Cloud regression passed (user-run confirmation).
- Commit:
  - API: `ac7f150`
- Status: `Completed (Tested)`

### PRS-012 / PRS-013 Follow-up Hardening
- Backlog Link: [PRS-012](./PRODUCTION_READINESS_BACKLOG.md#prs-012), [PRS-013](./PRODUCTION_READINESS_BACKLOG.md#prs-013)
- Type: `NFR` + `Reliability` + `Error consistency`
- Summary:
  - API auth path now returns `503 INFRA_REDIS` when Redis blocklist lookup is unavailable (instead of generic 500).
  - API error handler now always falls back to `X-Request-ID` so `request_id` is not null in failure responses.
  - Regression scripts hardened for manual-worker mode, opaque UUID request IDs, token-refresh guidance, dual logging (console + file), and clearer diagnostics.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/auth.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/app.py`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
- Commit:
  - API: `83060ac`
  - UI: `5e14f4a`
- Status: `Completed (Code)`

### PRS-016
- Backlog ID: `PRS-016`
- Backlog Link: [PRS-016](./PRODUCTION_READINESS_BACKLOG.md#prs-016)
- Type: `NFR` + `Performance`
- Summary: Optimized API `/jobs` pagination/count path for lower Redis load and faster history retrieval.
- Why: Avoid full-history metadata scans for common unfiltered paginated history calls.
- Files:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/jobs.py`
- Validation:
  - Python compile check passed for `routes/jobs.py`.
  - Local/cloud regression pending.
- Commit:
  - API: `e645e78`
- Status: `Completed (Code)`

### PRS-017
- Backlog ID: `PRS-017`
- Backlog Link: [PRS-017](./PRODUCTION_READINESS_BACKLOG.md#prs-017)
- Gap Link: [G-15](./CURRENT_STATE_AND_GAP_ANALYSIS.md#g-15)
- Type: `NFR` + `Performance`
- Summary: Reduced UI polling overhead by enforcing single-flight status polling, avoiding duplicate poll start, and throttling polling cadence in background tabs.
- Why: Prevent overlapping status requests and unnecessary timer activity, especially under weak networks or repeated restore paths.
- Files:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/polling.js`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/jobs.js`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/ui.js`
- Validation:
  - JavaScript syntax check passed for touched files via `node --check`.
  - Local bounded regression passed.
  - Cloud bounded regression passed.
- Commit:
  - UI: `<pending-commit>`
- Status: `Completed (Tested)`
