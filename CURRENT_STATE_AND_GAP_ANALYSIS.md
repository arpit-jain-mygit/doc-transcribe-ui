# Current State and Gap Analysis (UI + API + Worker)

This document describes what is already implemented in the 3 repos today, identifies gaps, and maps each gap to a backlog fix ID.

Backlog reference file:
- [Production Readiness & Scalability Backlog](./PRODUCTION_READINESS_BACKLOG.md)

---

## 1) Current Architecture (As-Is)

### UI (`doc-transcribe-ui`)
- Plain HTML/CSS/JS app with modular feature files.
- Handles:
  - Google sign-in flow
  - Upload (OCR + A/V)
  - Polling status
  - Cancel job
  - History with filters and load-more
  - Download output
- Key files:
  - `js/upload.js`, `js/polling.js`, `js/jobs.js`, `js/ui.js`
  - `partials/*.html`
  - `css/features/*.css`, `css/components/*.css`

### API (`doc-transcribe-api`)
- FastAPI service with Redis-backed job status and queueing.
- Handles:
  - Upload endpoint
  - Status endpoint
  - Jobs history endpoint with pagination/counts
  - Cancel endpoint
  - Health endpoint
- Key files:
  - `routes/upload.py`, `routes/status.py`, `routes/jobs.py`
  - `services/queue.py`, `services/redis_client.py`, `services/auth.py`
  - `config.py`, `app.py`

### Worker (`doc-transcribe-worker`)
- Redis queue consumer with OCR/transcription dispatch.
- Handles:
  - Job pick from queue(s)
  - OCR pipeline
  - Transcription pipeline (chunked)
  - Progress and stage updates
  - Cancellation checks
  - DLQ on failure
- Key files:
  - `worker/worker_loop.py`
  - `worker/jobs/processor.py`
  - `worker/ocr.py`, `worker/transcribe.py`
  - `worker/cancel.py`

---

## 2) What Is Already Good

- End-to-end functionality is working (upload -> process -> download).
- History UX supports filtering, load-more, and metadata rendering.
- Cancellation exists in UI/API/worker path.
- Worker logs are reasonably verbose for runtime debugging.
- Queue mode supports local/cloud routing patterns.
- Basic health endpoint and pagination contract exist.

---

## 3) Gap List and Backlog Mapping

Legend:
- Severity: `High`, `Medium`, `Low`
- Fix link points to backlog file section.

<a id="g-01"></a>
### G-01: No formal architecture boundary docs across all repos
- Severity: High
- Impact: New engineer onboarding is slow; code placement becomes inconsistent.
- Status: Closed (Tested).
- Implemented artifacts:
  - UI: `ARCHITECTURE.md`, `CONTRIBUTING.md`, `js/README.md`
  - API: `ARCHITECTURE.md`, `CONTRIBUTING.md`
  - Worker: `ARCHITECTURE.md`, `CONTRIBUTING.md`, `worker/README.md`
- Fix backlog:
  - [PRS-001](./PRODUCTION_READINESS_BACKLOG.md#prs-001)

<a id="g-02"></a>
### G-02: Canonical field contract not documented as single source of truth
- Severity: High
- Impact: UI/API/worker field drift risk (`duration`, `duration_sec`, etc.).
- Status: Closed (Code).
- Implemented artifacts:
  - UI: `JOB_STATUS_CONTRACT.md`, `js/job-contract.js`
  - API: `JOB_STATUS_CONTRACT.md`, `schemas/job_contract.py`, `routes/contract.py` (`GET /contract/job-status`)
  - Worker: `JOB_STATUS_CONTRACT.md`, `worker/contract.py`
- Fix backlog:
  - [PRS-002](./PRODUCTION_READINESS_BACKLOG.md#prs-002)

<a id="g-03"></a>
### G-03: Error code standard is missing
- Severity: High
- Impact: Different layers emit inconsistent error semantics; hard to troubleshoot.
- Status: Closed (Code).
- Implemented artifacts:
  - UI: standardized failed-message resolver in `js/utils.js` and failed toast usage in `js/polling.js`
  - API: failed payload normalization in `routes/status.py`
  - Worker: centralized error classifier in `worker/error_catalog.py` + consistent failed/cancelled field writes in `worker/worker_loop.py`
- Fix backlog:
  - [PRS-003](./PRODUCTION_READINESS_BACKLOG.md#prs-003)
  - [PRS-012](./PRODUCTION_READINESS_BACKLOG.md#prs-012)

<a id="g-04"></a>
### G-04: Startup config validation is partial
- Severity: Medium
- Impact: Misconfiguration failures surface late at runtime.
- Fix backlog:
  - [PRS-004](./PRODUCTION_READINESS_BACKLOG.md#prs-004)

<a id="g-05"></a>
### G-05: Correlation ID not propagated end-to-end
- Severity: High
- Impact: Hard to trace one user request across UI/API/worker logs.
- Fix backlog:
  - [PRS-005](./PRODUCTION_READINESS_BACKLOG.md#prs-005)

<a id="g-06"></a>
### G-06: Logging is verbose but not standardized JSON with required fields
- Severity: High
- Impact: Hard to query/aggregate logs and build reliable diagnostics.
- Fix backlog:
  - [PRS-006](./PRODUCTION_READINESS_BACKLOG.md#prs-006)

<a id="g-07"></a>
### G-07: Operational metrics/SLOs are missing
- Severity: Medium
- Impact: Limited proactive monitoring; mostly reactive debugging.
- Fix backlog:
  - [PRS-007](./PRODUCTION_READINESS_BACKLOG.md#prs-007)

<a id="g-08"></a>
### G-08: No explicit state machine guard for status transitions
- Severity: High
- Impact: Risk of inconsistent lifecycle states under race/retry conditions.
- Fix backlog:
  - [PRS-008](./PRODUCTION_READINESS_BACKLOG.md#prs-008)

<a id="g-09"></a>
### G-09: Upload idempotency not implemented
- Severity: High
- Impact: Duplicate jobs possible during retry/network instability.
- Fix backlog:
  - [PRS-009](./PRODUCTION_READINESS_BACKLOG.md#prs-009)

<a id="g-10"></a>
### G-10: Retry policy is not typed by failure class
- Severity: High
- Impact: Potential over-retry on fatal errors or under-retry on transient ones.
- Status: Closed (Tested).
- Implemented artifacts:
  - Worker: `worker/utils/retry_policy.py` (typed policies + bounded backoff + jitter)
  - Worker: `worker/utils/gcs.py` (GCS retry path moved to typed retry runner)
  - Worker: `worker/cancel.py` (cancel Redis check uses typed retry policy)
  - Worker: `worker/ocr.py`, `worker/transcribe.py` (Redis status writes use typed retry policy)
- Fix backlog:
  - [PRS-010](./PRODUCTION_READINESS_BACKLOG.md#prs-010)
  - [PRS-026](./PRODUCTION_READINESS_BACKLOG.md#prs-026)

<a id="g-11"></a>
### G-11: DLQ payload lacks full diagnostic envelope
- Severity: Medium
- Impact: Replay and root-cause analysis need manual digging.
- Fix backlog:
  - [PRS-011](./PRODUCTION_READINESS_BACKLOG.md#prs-011)

<a id="g-12"></a>
### G-12: API exception mapping is not fully normalized
- Severity: High
- Impact: UI may receive mixed error styles and less actionable feedback.
- Fix backlog:
  - [PRS-012](./PRODUCTION_READINESS_BACKLOG.md#prs-012)

<a id="g-13"></a>
### G-13: Security hardening gaps (strict auth/CORS policy consistency)
- Severity: High
- Impact: Auth/CORS behavior can vary by environment and surprise users.
- Fix backlog:
  - [PRS-013](./PRODUCTION_READINESS_BACKLOG.md#prs-013)
  - [PRS-014](./PRODUCTION_READINESS_BACKLOG.md#prs-014)
  - [PRS-015](./PRODUCTION_READINESS_BACKLOG.md#prs-015)

<a id="g-14"></a>
### G-14: `/jobs` performance can degrade with growth
- Severity: High
- Impact: History loading latency increases as data size grows.
- Fix backlog:
  - [PRS-016](./PRODUCTION_READINESS_BACKLOG.md#prs-016)

<a id="g-15"></a>
### G-15: Polling/call efficiency can be further optimized
- Severity: Medium
- Impact: Extra API load and slower UX on poor networks.
- Fix backlog:
  - [PRS-017](./PRODUCTION_READINESS_BACKLOG.md#prs-017)

<a id="g-16"></a>
### G-16: Worker tuning knobs are limited/document-fragmented
- Severity: Medium
- Impact: Difficult to tune throughput/quality per deployment context.
- Fix backlog:
  - [PRS-018](./PRODUCTION_READINESS_BACKLOG.md#prs-018)

<a id="g-17"></a>
### G-17: Queue partitioning by workload is not first-class
- Severity: Medium
- Impact: OCR and A/V workloads can contend and increase wait time.
- Fix backlog:
  - [PRS-019](./PRODUCTION_READINESS_BACKLOG.md#prs-019)
  - [PRS-020](./PRODUCTION_READINESS_BACKLOG.md#prs-020)

<a id="g-18"></a>
### G-18: Capacity baseline (5/10 users) not formally measured
- Severity: Medium
- Impact: No reliable concurrency expectation to communicate.
- Fix backlog:
  - [PRS-021](./PRODUCTION_READINESS_BACKLOG.md#prs-021)

<a id="g-19"></a>
### G-19: Readiness/runbook/feature-flag maturity is incomplete
- Severity: Medium
- Impact: Slower incident handling and riskier rollouts.
- Fix backlog:
  - [PRS-022](./PRODUCTION_READINESS_BACKLOG.md#prs-022)
  - [PRS-023](./PRODUCTION_READINESS_BACKLOG.md#prs-023)
  - [PRS-024](./PRODUCTION_READINESS_BACKLOG.md#prs-024)

<a id="g-20"></a>
### G-20: Cost controls are mostly implicit, not policy-driven
- Severity: Medium
- Impact: Risk of cost spikes and inconsistent user experience for large jobs.
- Fix backlog:
  - [PRS-025](./PRODUCTION_READINESS_BACKLOG.md#prs-025)
  - [PRS-026](./PRODUCTION_READINESS_BACKLOG.md#prs-026)
  - [PRS-027](./PRODUCTION_READINESS_BACKLOG.md#prs-027)

<a id="g-21"></a>
### G-21: Modular layering refactor not yet complete
- Severity: High
- Impact: Long-term maintainability and velocity will degrade.
- Fix backlog:
  - [PRS-028](./PRODUCTION_READINESS_BACKLOG.md#prs-028)
  - [PRS-029](./PRODUCTION_READINESS_BACKLOG.md#prs-029)
  - [PRS-030](./PRODUCTION_READINESS_BACKLOG.md#prs-030)

<a id="g-22"></a>
### G-22: Test and CI quality gates are insufficient
- Severity: High
- Impact: Regression risk during frequent changes.
- Fix backlog:
  - [PRS-031](./PRODUCTION_READINESS_BACKLOG.md#prs-031)
  - [PRS-032](./PRODUCTION_READINESS_BACKLOG.md#prs-032)
  - [PRS-033](./PRODUCTION_READINESS_BACKLOG.md#prs-033)

---

## 4) Recommended next execution sequence

1. `PRS-001` to `PRS-004` (foundation)
2. `PRS-005` to `PRS-012` (traceability + reliability)
3. `PRS-013` to `PRS-018` (security + performance)
4. `PRS-028` to `PRS-033` (modularity + test gates)
5. `PRS-019` to `PRS-027` (scale + ops + cost maturity)

---

## 5) Document maintenance rule

- When a backlog item is marked `Completed (Tested)` in `PRODUCTION_READINESS_BACKLOG.md`, update the corresponding `G-xx` line in this file:
  - Add `Status: Closed`
  - Add commit links and a short verification note.
