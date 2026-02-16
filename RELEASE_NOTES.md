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
