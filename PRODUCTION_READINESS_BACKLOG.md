# Production Readiness & Scalability Backlog
Companion impact guide: [Production Readiness Impact Guide](./PRODUCTION_READINESS_IMPACT_GUIDE.md)
Companion agent guide: [Agentic AI Backlog](./AGENTIC_AI_BACKLOG.md)
Benefit testcases reference: [Agentic AI Backlog - Plain-English Benefit Testcases](./AGENTIC_AI_BACKLOG.md#5-plain-english-benefit-testcases-before-vs-after-agents)

Status values:
- `Planned`
- `In Progress`
- `Completed (Code)`
- `Completed (Tested)`

## How to use
- Update `Status` when implementation starts/completes.
- Update `Test` only after local + integration verification.
- Update `Repo-wise Change Summary` with crisp per-repo changes after each implementation.
- Keep repo scope explicit: `UI`, `API`, `Worker`, or `All`.
- Cross-reference current implementation and gaps here:
  - [Current State and Gap Analysis](./CURRENT_STATE_AND_GAP_ANALYSIS.md)
- Mandatory policy for all backlog items: every fix must include required logging updates for new/changed execution paths.
- Mandatory policy for all backlog items: execute the required set from [Functional Regression Test Suite](./FUNCTIONAL_REGRESSION_TESTS.md).
- Mandatory policy for all backlog items: include both positive and negative test coverage for each new/changed behavior.

## Backlog

| ID | Phase | Task | Repo | Functional Requirement Served | User Benefit | How it helps in your project (Users / Dev / Ops / Product) | Status | Test | Repo-wise Change Summary |
|---|---|---|---|---|---|---|---|---|---|
| PRS-001 | 0 | Define architecture boundaries and coding standards | All | Maintainability | Faster onboarding for new engineers | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: architecture/backlog/regression docs + stack/regression scripts. API: stage-wise structured logging + logging config. Worker: architecture/contribution/guide docs and module map docs. |
| PRS-002 | 0 | Define canonical job/status field contract | All | Data consistency | Fewer UI/API/Worker mismatch bugs | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: canonical contract resolver/doc (`3fe0a4b`). API: source-of-truth contract schema + endpoint (`347e903`). Worker: aligned contract constants/docs (`14bb4d2`). |
| PRS-003 | 0 | Define error-code catalog | All | Predictable error handling | Clearer, actionable error messages | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: standardized error handling + regression diagnostics/worker checks (`b2cf954`,`f284da0`,`fd16c2b`,`42414a2`). API: status normalization + structured exception payloads (`bdb1923`,`27f322e`). Worker: centralized error catalog/resilience (`4579341`,`5d91486`). |
| PRS-004 | 0 | Add startup env validation | API, Worker | Runtime stability | Fewer production misconfig failures | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: regression precheck hardening and worker health fallback (`fc1db9f`). API: fail-fast startup env validator (`2c7134c`). Worker: fail-fast startup env validator (`071f5c0`). |
| PRS-005 | 1 | Correlation ID propagation (`request_id`) | UI, API, Worker | Traceability | Faster support/debug turnaround | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: request-id propagation in UI + regression diagnostics (`59e8699`, `771d4d8`). API: request-id middleware + contract/status propagation (`4d259f9`). Worker: request-id in processing/status/log flow (`c60e875`). |
| PRS-006 | 1 | Structured JSON logging with mandatory fields | API, Worker | Observability | Easier root-cause analysis | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: structured JSON formatter + mandatory stage payload fields (`5cdae48`). Worker: structured JSON logs + stage event payload normalization (`a119f7a`). |
| PRS-007 | 1 | Add operational metrics (success/fail/retry/latency) | API, Worker | Monitoring | Detect issues before users report | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: request counters/latency metrics + `/metrics` endpoint (`87e8a45`). Worker: dispatch/GCS retry/latency metrics (`bdbf74f`) and GCS error-path hardening (`41223a3`). |
| PRS-008 | 2 | Enforce job status transition state machine | API, Worker | Reliability | Predictable job lifecycle behavior | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: guarded status transitions for upload/cancel + transition helper (`d2f8afb`). Worker: guarded transitions across loop/OCR/transcribe/dispatcher + helper (`021542f`). |
| PRS-009 | 2 | Add idempotent upload key and duplicate job reuse | API, UI | Reliability | No duplicate jobs on retry/network glitches | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: upload idempotency key generation + header propagation (`74c1ec1`). API: idempotent key handling + duplicate reuse + enqueue-once guard (`ab5f3cb`). Worker: contract version alignment for rollout (`7b0d273`). |
| PRS-010 | 2 | Typed retry policy with backoff + jitter | Worker | Reliability | Better success under transient failures | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | Worker: typed retry utility with exponential backoff + jitter, integrated into Redis cancel checks, status writes, and GCS I/O retries (`edaf8c8`). |
| PRS-011 | 2 | DLQ enrichment (`error_code`, `attempts`, stage) | Worker | Recoverability | Easier failed-job replay and diagnosis | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | Worker: enriched DLQ envelope with `error_code/error_type`, `attempts/max_attempts`, failed stage, queue/source/request_id, worker_id, and original payload for replay (`29c44d4`). |
| PRS-012 | 2 | Global exception mapping to stable API payloads | API | Error consistency | Less confusing UI errors | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: strict global error envelope in `app.py` for HTTP/validation/unhandled exceptions with stable fields (`error_code`, `error_message`, `detail`, `path`, `request_id`) and normalized auth/not-found/conflict codes. |
| PRS-013 | 3 | Tighten token validation (`iss`, `aud`, expiry) | API | Security | Stronger auth correctness | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: strict token checks for issuer/audience/authorized party/exp/nbf/iat + normalized auth error codes via `services/auth.py` and shared validation path in `routes/auth.py` (`8a81134`). |
| PRS-014 | 3 | Environment-based strict CORS allowlist | API | Security | Fewer CORS/auth surprises | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: strict env-driven CORS allowlist (`CORS_ALLOW_ORIGINS`) with startup validation; optional regex only when explicitly configured (`CORS_ALLOW_ORIGIN_REGEX`) in `app.py` and `startup_env.py`. UI scripts: local stack now injects safe default `CORS_ALLOW_ORIGINS` for API startup. |
| PRS-015 | 3 | Server-side MIME/extension/size validation | API | Security and validation | Clear rejection of unsupported files | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: upload validation enforces allowed extensions/MIME prefixes and max-size per job type (`MAX_OCR_FILE_SIZE_MB`, `MAX_TRANSCRIPTION_FILE_SIZE_MB`) with stable error codes (`UNSUPPORTED_FILE_TYPE`, `UNSUPPORTED_MIME_TYPE`, `FILE_TOO_LARGE`) in `routes/upload.py`. |
| PRS-016 | 4 | Optimize `/jobs` pagination and counts path | API | Performance | Faster history loading | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: optimized `/jobs` with unfiltered fast-path pagination (slice-only read), avoided full metadata prefetch when `include_counts=false`, and added stage/metric observability (`total_user_jobs`, `scanned_count`, `matched_total`, `fast_path`) in `routes/jobs.py`. |
| PRS-017 | 4 | Reduce polling overhead and duplicate pollers | UI | Performance | Smoother app under load | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: single-flight status polling loop (no overlap), duplicate-start guard on session restore, visibility-aware polling backoff, and history last-refreshed ticker scoped to active history view (`2b3dd83`). |
| PRS-018 | 4 | Make worker chunk/page strategy configurable | Worker | Performance | Better throughput and tuning flexibility | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | Worker: added configurable transcription chunk duration (`TRANSCRIBE_CHUNK_DURATION_SEC`), OCR DPI (`OCR_DPI`), and OCR page-window batching (`OCR_PAGE_BATCH_SIZE`) with startup validation and strategy logs (`ecd757d`). |
| PRS-019 | 5 | Queue partitioning by workload (OCR vs A/V) | API, Worker | Scalability | Reduced queue contention | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: optional queue partitioning via `FEATURE_QUEUE_PARTITIONING` and `QUEUE_NAME_OCR/QUEUE_NAME_TRANSCRIPTION`; Worker: added `QUEUE_MODE=partitioned` with OCR/TRANSCRIPTION queue+DLQ mapping. |
| PRS-020 | 5 | Worker concurrency controls by queue/type | Worker | Scalability | Better concurrent user support | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | Worker: added per-type inflight limits (`WORKER_MAX_INFLIGHT_OCR`, `WORKER_MAX_INFLIGHT_TRANSCRIPTION`) with Redis-backed inflight sets and controlled requeue when limits are reached. |
| PRS-021 | 5 | Load test baseline (5/10 concurrent users) | All | Capacity planning | Predictable performance expectations | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI/scripts: added `scripts/load_test_baseline.sh` and `LOAD_TEST_BASELINE.md` to run/record 5+10 concurrent OCR baseline with terminal-status summaries. |
| PRS-022 | 6 | Add readiness checks for dependencies | API, Worker | Operability | Safer deploys and faster fail detection | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: added `/ready` with Redis+GCS checks; Worker: added `worker/readiness.py` dependency check utility for startup/ops validation. |
| PRS-023 | 6 | Add runbooks for top failure scenarios | All | Operability | Faster incident resolution | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI/docs: added `RUNBOOKS.md` with queue-stuck, CORS, quota-limit, dependency, and concurrency tuning troubleshooting paths. |
| PRS-024 | 6 | Add feature flags for risky changes | API, Worker, UI | Operability | Safe rollout and rollback | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: `services/feature_flags.py`; Worker: env-controlled queue mode and retry budgets; UI: `window.FEATURE_COST_HINTS` and `FEATURE_FLAGS.md` rollout guidance. |
| PRS-025 | 7 | Enforce limits/quotas (size/pages/duration/user) | API | Cost control | Stable service under abuse/spikes | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: added quota+limits service (`services/quota.py`) for daily/active user caps, OCR page caps, and transcription duration caps; wired into upload orchestration and startup validation. |
| PRS-026 | 7 | Retry/cost budgets by error type | Worker | Cost control | Prevent expensive retry loops | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | Worker: added retry-budget policy by error type (`RETRY_BUDGET_TRANSIENT/MEDIA/DEFAULT`) with controlled requeue attempts and final DLQ fallback. |
| PRS-027 | 7 | User-facing cost/effort hints for large jobs | UI | Cost transparency | Better user expectations pre-upload | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: added pre-upload effort hints and media-duration propagation (`X-Media-Duration-Sec`) to support transparent estimate + server-side duration limits. |
| PRS-028 | 8 | Refactor API into layered modules | API | Maintainability | Easier long-term feature development | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: extracted upload orchestration from `routes/upload.py` into `services/upload_orchestrator.py` to keep route thin and move business/infra flow into service layer (`e8a9b4f`). |
| PRS-029 | 8 | Refactor Worker into orchestrator/adapters/executors | Worker | Maintainability | Clearer ownership and easier debugging | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | Worker: introduced layered modules `worker/orchestrator/router.py`, `worker/executors/*`, `worker/adapters/*`; kept backward-compatible dispatcher/processor shims and added route/executor logs with identifiers (`1de5432`). |
| PRS-030 | 8 | Refactor UI into api-client/controllers/views/formatters | UI | Maintainability | Faster UI iteration with fewer regressions | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI: introduced centralized `js/api-client.js` and migrated polling/history API calls from `jobs.js` and `polling.js` to client layer; updated module map docs (`js/README.md`) (`53f5a7b`). |
| PRS-031 | 9 | Add unit tests for core logic and formatters | All | Quality | Prevents regressions | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | API: added `unittest` coverage for upload orchestrator constraints/idempotency helpers; Worker: added `unittest` coverage for status transitions and error classification; UI: added Node unit tests for `job-contract.js` and `utils.js` plus `npm test` script. |
| PRS-032 | 9 | Add integration tests for e2e job lifecycle | All | Quality | Confidence before deploy | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | UI/scripts: upgraded local/cloud regression runners to certify lifecycle status sequences (`QUEUED/PROCESSING->COMPLETED`), and emit machine-readable integration reports (`integration-local*.jsonl`, `integration-cloud*.jsonl`) with scenario/job/request/duration/result. |
| PRS-033 | 9 | Add CI gates (`lint`, tests, contract checks) | All | Quality governance | Stable releases | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Tested) | Completed (Local + Cloud Regression) | Added repo CI workflows: API/Worker run unit tests + contract sanity checks; UI runs unit tests + regression script syntax gates in GitHub Actions. |
| PRS-034 | 8 | Add user-centric file and method comments across code/config files | All | Maintainability and supportability | Faster developer/tester/support understanding of OCR/transcription flow | Baseline readiness item: improves reliability/maintainability; see User Benefit and Repo-wise summary. | Completed (Code) | Pending (Run Local + Cloud Regression) | UI/API/Worker: added crisp user-centric comments at file top and method/function level (where applicable) across `.js`, `.html`, `.css`, `.py`, `.yaml`, `.yml` tracked files. |
| PRS-035 | 10 | Smart Intake Agent (auto-routing + prechecks + ETA) | UI, API | Intelligent intake and routing | Faster first response and fewer bad uploads | Users: smarter file guidance; Dev: fewer bad-input bugs; Ops: lower avoidable failures; Product: better conversion at upload start. | Planned | Pending | Test criteria: verify routing decisions, precheck hints, and ETA accuracy against sampled OCR/A-V files. |
| PRS-036 | 10 | OCR Quality Agent (confidence scoring + page-level guidance) | Worker, API, UI | OCR quality assurance | Better text quality with actionable remediation | Users: better OCR output quality; Dev: measurable quality signals; Ops: early poor-scan detection; Product: quality KPI visibility. | Planned | Pending | Test criteria: validate low-confidence detection, page-level quality signals, and UI guidance on poor scans. |
| PRS-037 | 10 | Transcription Quality Agent (segment confidence + noise/speaker hints) | Worker, API, UI | Transcription quality assurance | More reliable transcripts with targeted fixes | Users: stronger transcript reliability; Dev: segment-level confidence data; Ops: quicker noisy-audio diagnosis; Product: trust improvements. | Planned | Pending | Test criteria: verify segment confidence output, noisy-audio flags, and recommended reprocessing strategies. |
| PRS-038 | 10 | Retry & Recovery Agent (policy-driven recovery orchestration) | Worker, API | Autonomous failure recovery | Higher completion rate during transient failures | Users: higher completion on transient issues; Dev: policy-driven recovery paths; Ops: reduced manual reprocessing; Product: stability gains. | Planned | Pending | Test criteria: inject transient/provider failures and confirm bounded retry, recovery action, and DLQ traceability. |
| PRS-039 | 10 | Cost Guardrail Agent (quota/cost prediction + enforcement) | API, UI | Cost governance | Predictable usage and reduced surprise failures | Users: transparent limits/cost expectations; Dev: safer policy controls; Ops: predictable load/cost; Product: controlled spend vs growth. | Planned | Pending | Test criteria: validate projected-cost hints, quota threshold behavior, and controlled rejection paths. |
| PRS-040 | 10 | Queue Orchestration Agent (dynamic balancing/prioritization) | Worker, API | Throughput and fairness optimization | Lower wait time under mixed OCR/A-V load | Users: reduced wait under mixed load; Dev: adaptive orchestration hooks; Ops: lower queue contention; Product: better peak-time UX. | Planned | Pending | Test criteria: load-test mixed jobs and confirm adaptive queue balancing improves p95 queue wait. |
| PRS-041 | 10 | User Assist Agent (in-flow guidance + next-best action) | UI, API | UX assistance | Clearer guidance during wait/failure/retry states | Users: actionable next steps in real time; Dev: consistent guidance patterns; Ops: fewer repetitive tickets; Product: lower drop-off. | Planned | Pending | Test criteria: verify contextual guidance appears for queued/failed/cancelled scenarios and improves task completion. |
| PRS-042 | 10 | Incident Triage Agent (cross-layer root-cause assistant) | API, Worker, UI/scripts | Operational triage acceleration | Faster support resolution with fewer manual hops | Users: faster issue resolution; Dev: cross-layer trace shortcuts; Ops: reduced MTTR; Product: improved reliability perception. | Planned | Pending | Test criteria: replay incidents and verify agent maps request_id/job_id to root cause and runbook steps. |
| PRS-043 | 10 | Regression Certification Agent (auto-certify release readiness) | UI/scripts, API, Worker | Release governance automation | Faster, consistent go/no-go decisions | Users: fewer release regressions; Dev: automated release gates; Ops: predictable deploy quality; Product: safer release cadence. | Planned | Pending | Test criteria: ensure certification output matches local/cloud regression, contract checks, and CI outcomes. |
| PRS-044 | 10 | Product Insights Agent (usage/failure analytics + prioritization) | API, Worker, UI | Product feedback loop | Data-driven UX and roadmap decisions | Users: targeted UX improvements; Dev: data-backed fix prioritization; Ops: trend visibility; Product: roadmap driven by evidence. | Planned | Pending | Test criteria: validate generated insight reports, trend detection quality, and backlog recommendation relevance. |
| PRS-045 | 11 | **BIG EPIC**: Digambar Jainism GPT using RAG | All | Domain-specific AI knowledge assistant | Accurate, grounded answers on Digambar Jain concepts with source traceability | Users: grounded Digambar Jain answers; Dev: reusable RAG architecture; Ops: governable AI operations; Product: strategic AI differentiation. | Planned | Pending | Start after PRS-035..044. Build ingestion, indexing, retrieval, grounding, evaluation, safety, and deployment lifecycle for a Digambar Jainism RAG assistant. |
| PRS-046A | 6 | Operations Dashboard (real-time reliability + incident triage) | API, Worker, UI | Operability observability | Faster incident detection, diagnosis, and recovery | Users: fewer prolonged outages; Dev: faster operational debugging; Ops: single-pane incident control; Product: SLA transparency. | Planned | Pending | Feature set: queue depth/inflight, funnel by status, failure taxonomy, latency/SLO, dependency/provider health, regression+CI run health. |
| PRS-046B | 6 | Product Analytics Dashboard (usage + outcomes + cost) | API, Worker, UI | Product decision support | Better UX prioritization and cost-aware roadmap | Users: improved journey over time; Dev: measurable UX impact; Ops: demand trend awareness; Product: stronger prioritization via analytics. | Planned | Pending | Feature set: active users, completion/drop-off by step, median turnaround by type, quota/cost trend, cohort retention, top user pain points. |

## Backlog Item Anchors

- <a id="prs-001"></a>`PRS-001`
- <a id="prs-002"></a>`PRS-002`
- <a id="prs-003"></a>`PRS-003`
- <a id="prs-004"></a>`PRS-004`
- <a id="prs-005"></a>`PRS-005`
- <a id="prs-006"></a>`PRS-006`
- <a id="prs-007"></a>`PRS-007`
- <a id="prs-008"></a>`PRS-008`
- <a id="prs-009"></a>`PRS-009`
- <a id="prs-010"></a>`PRS-010`
- <a id="prs-011"></a>`PRS-011`
- <a id="prs-012"></a>`PRS-012`
- <a id="prs-013"></a>`PRS-013`
- <a id="prs-014"></a>`PRS-014`
- <a id="prs-015"></a>`PRS-015`
- <a id="prs-016"></a>`PRS-016`
- <a id="prs-017"></a>`PRS-017`
- <a id="prs-018"></a>`PRS-018`
- <a id="prs-019"></a>`PRS-019`
- <a id="prs-020"></a>`PRS-020`
- <a id="prs-021"></a>`PRS-021`
- <a id="prs-022"></a>`PRS-022`
- <a id="prs-023"></a>`PRS-023`
- <a id="prs-024"></a>`PRS-024`
- <a id="prs-025"></a>`PRS-025`
- <a id="prs-026"></a>`PRS-026`
- <a id="prs-027"></a>`PRS-027`
- <a id="prs-028"></a>`PRS-028`
- <a id="prs-029"></a>`PRS-029`
- <a id="prs-030"></a>`PRS-030`
- <a id="prs-031"></a>`PRS-031`
- <a id="prs-032"></a>`PRS-032`
- <a id="prs-033"></a>`PRS-033`
- <a id="prs-034"></a>`PRS-034`
- <a id="prs-035"></a>`PRS-035`
- <a id="prs-036"></a>`PRS-036`
- <a id="prs-037"></a>`PRS-037`
- <a id="prs-038"></a>`PRS-038`
- <a id="prs-039"></a>`PRS-039`
- <a id="prs-040"></a>`PRS-040`
- <a id="prs-041"></a>`PRS-041`
- <a id="prs-042"></a>`PRS-042`
- <a id="prs-043"></a>`PRS-043`
- <a id="prs-044"></a>`PRS-044`
- <a id="prs-045"></a>`PRS-045`
- <a id="prs-046a"></a>`PRS-046A`
- <a id="prs-046b"></a>`PRS-046B`

## Execution order
1. Phase 1 + Phase 2
2. Phase 3
3. Phase 4
4. Phase 8 + Phase 9
5. Phase 5 + Phase 6 + Phase 7

## Update log
- 2026-02-14: Backlog initialized.
- 2026-02-14: PRS-001 implemented at code/documentation level across UI/API/Worker; validation pending.
- 2026-02-16: PRS-001 local bounded regression passed (`OCR job_id=e77a176513b545ceadb06bfae7f2f346`, `TRANSCRIPTION job_id=07bac199dbfd4d84b84902bdfdd7a43b`).
- 2026-02-16: PRS-001 cloud regression confirmed passed by user run.
- 2026-02-16: PRS-002 completed and regression-validated (local + cloud) across UI/API/Worker.
- 2026-02-16: PRS-003 completed and regression-validated (local + cloud) across UI/API/Worker/scripts.
- 2026-02-16: PRS-004 completed and regression-validated (local + cloud) across API/Worker, with UI regression precheck hardening.
- 2026-02-17: PRS-010 completed and regression-validated (local + cloud) with typed retry/backoff + jitter integration in Worker.
- 2026-02-17: PRS-011 completed and regression-validated (local + cloud) with enriched DLQ envelope metadata in Worker.
- 2026-02-17: PRS-012 completed and regression-validated (local + cloud) with global API exception envelope normalization.
- 2026-02-17: PRS-013 completed and regression-validated (local + cloud) with strict token validation (`iss`, `aud`, `azp`, expiry) and normalized auth error codes.
- 2026-02-17: PRS-014 completed and regression-validated (local + cloud) with strict environment-based CORS allowlist and local startup default wiring.
- 2026-02-17: PRS-015 completed and regression-validated (local + cloud) with strict server-side MIME/extension/size validation.
- 2026-02-17: PRS-016 implementation completed at code level in API (`routes/jobs.py`); regression pending.
- 2026-02-17: PRS-017 completed and regression-validated (local + cloud) in UI with single-flight poller guards, visibility-aware polling cadence, and history ticker lifecycle controls.
- 2026-02-17: PRS-018 completed and regression-validated (local + cloud) in Worker with configurable chunk/page strategy and startup env guardrails.
- 2026-02-17: PRS-028 completed and regression-validated (local + cloud) in API after extracting upload orchestration into service layer.
- 2026-02-17: PRS-029 completed and regression-validated (local + cloud) in Worker with explicit orchestrator/adapter/executor boundaries.
- 2026-02-17: PRS-030 completed and regression-validated (local + cloud) in UI with centralized API client layer for polling/history calls.
- 2026-02-17: PRS-031 code-complete with passing unit suites in API/Worker/UI; awaiting bounded regression validation (local + cloud).
- 2026-02-17: PRS-032 code-complete with lifecycle-aware integration assertions and JSONL evidence reports in local/cloud regression runners; awaiting bounded regression validation.
- 2026-02-18: PRS-019..027 and PRS-033 implemented at code level (queue partitioning, worker concurrency controls, load baseline, readiness checks, runbooks, feature flags, quotas/limits, retry budgets, UI effort hints, CI gates); awaiting bounded regression validation.
- 2026-02-18: PRS-016, PRS-019..027, PRS-031..033 validated with local + cloud regression and marked `Completed (Tested)`.
- 2026-02-18: PRS-034 completed at code level by adding crisp user-centric file/method comments across UI/API/Worker source/config files; regression pending.

## Agent Basics (Beginner Friendly)

An AI agent is a goal-driven software component that can:
1. Observe context (`file type`, `job status`, `logs`, `errors`, `queue state`).
2. Decide next best action (using rules/policies/model reasoning).
3. Act (call API, trigger workflow, update status, suggest next step).
4. Re-check outcome and adapt until goal is reached or safely stopped.

How this helps in this project:
- End users: faster uploads, fewer failures, better quality, clearer guidance.
- Developers: quicker debugging, less manual triage, safer changes.
- Ops/support: faster incident detection and root-cause identification.
- Product: clearer adoption/failure insights and better prioritization.

What changes when using agents vs non-agent logic:
- Non-agent: static flow (`if X then Y`) with limited adaptation.
- Agentic: context-aware action selection with retry/recovery and evidence traceability.

## Recommended Agentic AI Opportunities

1. Smart Intake Agent
- Routes file type, validates input quality, predicts processing path/time, and suggests best settings.

2. OCR Quality Agent
- Scores OCR confidence/page quality, flags low-quality pages, and suggests enhancement or re-upload.

3. Transcription Quality Agent
- Detects low-confidence segments, speaker/noise issues, and recommends chunk/model strategy.

4. Retry & Recovery Agent
- Classifies failures, applies policy-based retries, enriches DLQ context, and proposes recovery actions.

5. Cost Guardrail Agent
- Monitors quotas/limits, predicts cost impact, and enforces safe usage policies.

6. Queue Orchestration Agent
- Balances OCR vs A/V queues, concurrency, and prioritization for stable throughput.

7. User Assist Agent
- Provides real-time wait estimates, actionable errors, and next-best guidance in UI.

8. Incident Triage Agent
- Correlates `request_id`/`job_id` across UI/API/Worker logs and drafts root-cause + runbook actions.

9. Regression Certification Agent
- Runs local/cloud regression + contract checks and certifies release readiness per backlog item.

10. Product Insights Agent
- Analyzes usage/failure trends and recommends prioritized UX/product improvements.

### Recommended starter order (for first-time Agentic AI implementation)

1. `PRS-035` Smart Intake Agent
2. `PRS-041` User Assist Agent
3. `PRS-039` Cost Guardrail Agent
4. `PRS-042` Incident Triage Agent
5. `PRS-043` Regression Certification Agent
6. Advanced pipeline agents: `PRS-036`, `PRS-037`, `PRS-038`, `PRS-040`, `PRS-044`

## Detailed Item Specifications

### Table of contents
- [PRS-001 - Define architecture boundaries and coding standards](#prs-001--define-architecture-boundaries-and-coding-standards)
- [PRS-002 - Define canonical job/status field contract](#prs-002--define-canonical-jobstatus-field-contract)
- [PRS-003 - Define error-code catalog](#prs-003--define-error-code-catalog)
- [PRS-004 - Add startup env validation](#prs-004--add-startup-env-validation)
- [PRS-005 - Correlation ID propagation (`request_id`)](#prs-005--correlation-id-propagation-requestid)
- [PRS-006 - Structured JSON logging with mandatory fields](#prs-006--structured-json-logging-with-mandatory-fields)
- [PRS-007 - Add operational metrics (success/fail/retry/latency)](#prs-007--add-operational-metrics-successfailretrylatency)
- [PRS-008 - Enforce job status transition state machine](#prs-008--enforce-job-status-transition-state-machine)
- [PRS-009 - Add idempotent upload key and duplicate job reuse](#prs-009--add-idempotent-upload-key-and-duplicate-job-reuse)
- [PRS-010 - Typed retry policy with backoff + jitter](#prs-010--typed-retry-policy-with-backoff-jitter)
- [PRS-011 - DLQ enrichment (`error_code`, `attempts`, stage)](#prs-011--dlq-enrichment-errorcode-attempts-stage)
- [PRS-012 - Global exception mapping to stable API payloads](#prs-012--global-exception-mapping-to-stable-api-payloads)
- [PRS-013 - Tighten token validation (`iss`, `aud`, expiry)](#prs-013--tighten-token-validation-iss-aud-expiry)
- [PRS-014 - Environment-based strict CORS allowlist](#prs-014--environment-based-strict-cors-allowlist)
- [PRS-015 - Server-side MIME/extension/size validation](#prs-015--server-side-mimeextensionsize-validation)
- [PRS-016 - Optimize `/jobs` pagination and counts path](#prs-016--optimize-jobs-pagination-and-counts-path)
- [PRS-017 - Reduce polling overhead and duplicate pollers](#prs-017--reduce-polling-overhead-and-duplicate-pollers)
- [PRS-018 - Make worker chunk/page strategy configurable](#prs-018--make-worker-chunkpage-strategy-configurable)
- [PRS-019 - Queue partitioning by workload (OCR vs A/V)](#prs-019--queue-partitioning-by-workload-ocr-vs-av)
- [PRS-020 - Worker concurrency controls by queue/type](#prs-020--worker-concurrency-controls-by-queuetype)
- [PRS-021 - Load test baseline (5/10 concurrent users)](#prs-021--load-test-baseline-510-concurrent-users)
- [PRS-022 - Add readiness checks for dependencies](#prs-022--add-readiness-checks-for-dependencies)
- [PRS-023 - Add runbooks for top failure scenarios](#prs-023--add-runbooks-for-top-failure-scenarios)
- [PRS-024 - Add feature flags for risky changes](#prs-024--add-feature-flags-for-risky-changes)
- [PRS-025 - Enforce limits/quotas (size/pages/duration/user)](#prs-025--enforce-limitsquotas-sizepagesdurationuser)
- [PRS-026 - Retry/cost budgets by error type](#prs-026--retrycost-budgets-by-error-type)
- [PRS-027 - User-facing cost/effort hints for large jobs](#prs-027--user-facing-costeffort-hints-for-large-jobs)
- [PRS-028 - Refactor API into layered modules](#prs-028--refactor-api-into-layered-modules)
- [PRS-029 - Refactor Worker into orchestrator/adapters/executors](#prs-029--refactor-worker-into-orchestratoradaptersexecutors)
- [PRS-030 - Refactor UI into api-client/controllers/views/formatters](#prs-030--refactor-ui-into-api-clientcontrollersviewsformatters)
- [PRS-031 - Add unit tests for core logic and formatters](#prs-031--add-unit-tests-for-core-logic-and-formatters)
- [PRS-032 - Add integration tests for e2e job lifecycle](#prs-032--add-integration-tests-for-e2e-job-lifecycle)
- [PRS-033 - Add CI gates (`lint`, tests, contract checks)](#prs-033--add-ci-gates-lint-tests-contract-checks)
- [PRS-034 - Add user-centric file and method comments across code/config files](#prs-034--add-user-centric-file-and-method-comments-across-codeconfig-files)
- [PRS-035 - Smart Intake Agent (auto-routing + prechecks + ETA)](#prs-035--smart-intake-agent-auto-routing--prechecks--eta)
- [PRS-036 - OCR Quality Agent (confidence scoring + page-level guidance)](#prs-036--ocr-quality-agent-confidence-scoring--page-level-guidance)
- [PRS-037 - Transcription Quality Agent (segment confidence + noise/speaker hints)](#prs-037--transcription-quality-agent-segment-confidence--noisespeaker-hints)
- [PRS-038 - Retry & Recovery Agent (policy-driven recovery orchestration)](#prs-038--retry--recovery-agent-policy-driven-recovery-orchestration)
- [PRS-039 - Cost Guardrail Agent (quota/cost prediction + enforcement)](#prs-039--cost-guardrail-agent-quotacost-prediction--enforcement)
- [PRS-040 - Queue Orchestration Agent (dynamic balancing/prioritization)](#prs-040--queue-orchestration-agent-dynamic-balancingprioritization)
- [PRS-041 - User Assist Agent (in-flow guidance + next-best action)](#prs-041--user-assist-agent-in-flow-guidance--next-best-action)
- [PRS-042 - Incident Triage Agent (cross-layer root-cause assistant)](#prs-042--incident-triage-agent-cross-layer-root-cause-assistant)
- [PRS-043 - Regression Certification Agent (auto-certify release readiness)](#prs-043--regression-certification-agent-auto-certify-release-readiness)
- [PRS-044 - Product Insights Agent (usage/failure analytics + prioritization)](#prs-044--product-insights-agent-usagefailure-analytics--prioritization)
- [PRS-045 - BIG EPIC: Digambar Jainism GPT using RAG](#prs-045---big-epic-digambar-jainism-gpt-using-rag)
- [PRS-046A - Operations Dashboard (real-time reliability + incident triage)](#prs-046a---operations-dashboard-real-time-reliability--incident-triage)
- [PRS-046B - Product Analytics Dashboard (usage + outcomes + cost)](#prs-046b---product-analytics-dashboard-usage--outcomes--cost)


### PRS-001 - Define architecture boundaries and coding standards

**Purpose**
- Establish a clear, uniform project structure across UI, API, and Worker so a new engineer can quickly understand where code belongs and how dependencies should flow.
- Prevent future ad-hoc code placement that makes debugging and refactoring expensive.

**Why this is in Phase 0**
- This is a foundation item. Every later backlog task (logging, retries, security, performance, scalability) becomes easier and safer when architecture boundaries are defined first.
- If skipped, later changes will be inconsistent and technical debt will increase.

**Repo touchpoints: why and how each repo is changed**
- `doc-transcribe-ui` (why): current JS logic is spread across multiple feature files, so we need documented boundaries for UI view logic vs API interaction vs utilities.
  - Module plan:
    - `js/views/` for DOM rendering and UX state transitions.
    - `js/services/` for API calls and polling orchestration.
    - `js/core/` for shared constants, formatters, validators.
  - Files to add/update:
    - `/Users/arpitjain/VSProjects/doc-transcribe-ui/ARCHITECTURE.md` (new)
    - `/Users/arpitjain/VSProjects/doc-transcribe-ui/CONTRIBUTING.md` (new/update)
    - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/README.md` (new; module map)

- `doc-transcribe-api` (why): route files currently hold mixed responsibilities (validation, orchestration, persistence), which should be layered.
  - Module plan:
    - `routes/` for HTTP request/response only.
    - `services/` for business logic.
    - `repositories/` for Redis/storage access.
    - `schemas/` for request/response contracts.
  - Files to add/update:
    - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/ARCHITECTURE.md` (new)
    - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/CONTRIBUTING.md` (new/update)
    - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/app.py` (update import/layer notes if needed)

- `doc-transcribe-worker` (why): worker loop, dispatch, OCR/transcription logic, and infra access need strict boundaries for maintainability and safer retries.
  - Module plan:
    - `worker/orchestrator/` for queue consumption and lifecycle state transitions.
    - `worker/executors/` for OCR/transcription execution logic.
    - `worker/adapters/` for Redis, GCS, model/provider integrations.
    - `worker/domain/` for typed errors and shared job models.
  - Files to add/update:
    - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/ARCHITECTURE.md` (new)
    - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/CONTRIBUTING.md` (new/update)
    - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/README.md` (new; module map)

**Functional requirement served**
- Maintainability and onboarding: engineers can safely extend upload, processing, status, cancellation, and history features without breaking architecture consistency.

**User benefit**
- Faster bug fixes and feature delivery because developers spend less time understanding code organization.
- Reduced regressions from cleaner ownership and dependency direction.

**Detailed implementation steps**
1. Create architecture docs in all 3 repos with:
- Layer definitions.
- Allowed dependency direction.
- “Do/Don’t” examples.

2. Define module ownership by feature:
- Upload flow ownership.
- Polling/status ownership.
- Queue and status transition ownership.

3. Add coding standards:
- File naming.
- Function size and complexity limits.
- Logging and exception handling minimum requirements.

4. Add PR checklist section:
- “Is new code in correct layer?”
- “Any cross-layer direct call added?”
- “Any contract change documented?”

5. Add migration notes:
- Which existing files are temporary mixed modules.
- Refactor order for later phases (`PRS-028`, `PRS-029`, `PRS-030`).

**Detailed test plan (for documentation quality and adoption)**
1. New joiner dry-run test:
- Ask a teammate unfamiliar with project to locate where to add:
  - a new API endpoint,
  - a new worker retry rule,
  - a new UI history rendering change.
- Pass criteria: they can identify correct module and target file within 10 minutes using docs only.

2. PR checklist compliance test:
- Open one sample PR in each repo and verify checklist items are filled.
- Pass criteria: no cross-layer violations introduced.

3. Dependency direction test:
- Spot-check imports:
  - UI view files should not directly call low-level fetch wrappers outside service layer.
  - API routes should not directly perform Redis calls if repository layer exists.
  - Worker executors should not own queue polling logic.
- Pass criteria: architecture rules are respected for modified files.

**Exit criteria for marking status**
- `Completed (Code)` when all docs and checklists are added in all 3 repos.
- `Completed (Tested)` when dry-run onboarding and PR checklist compliance tests pass.

### PRS-002 - Define canonical job/status field contract

**Purpose**
- Prevent field drift between UI/API/Worker by defining one authoritative job/status schema and enums.
- Ensure all three repos use the same canonical names for job type, status, lifecycle fields, and output metadata.

**Why this is in Phase 0**
- This is a foundational contract item. Later reliability/performance/security work depends on stable data semantics.
- Without this, each repo may keep adding aliases and inconsistent names.

**Repo touchpoints: why and how each repo is changed**
- `doc-transcribe-ui`
  - Added compatibility layer: `js/job-contract.js` for canonical field resolution with controlled alias fallback.
  - Added contract reference: `JOB_STATUS_CONTRACT.md`.
  - Wired contract module in `index.html`, and switched key reads in `js/jobs.js` and `js/ui.js` to contract resolvers.

- `doc-transcribe-api`
  - Added canonical source document: `JOB_STATUS_CONTRACT.md`.
  - Added machine-readable endpoint: `GET /contract/job-status`.
  - Added canonical constants in `schemas/job_contract.py`.
  - Updated upload/jobs route logic to consume constants and persist `contract_version`.

- `doc-transcribe-worker`
  - Added contract reference doc: `JOB_STATUS_CONTRACT.md`.
  - Added worker-local contract constants module: `worker/contract.py`.
  - Added contract references in worker docs to keep future changes aligned with API source.

**Functional requirement served**
- Data consistency across all layers for job lifecycle and metadata.

**User benefit**
- Fewer “UI shows blank/mismatched field” issues.
- More predictable history/status behavior and easier debugging.

**Detailed implementation steps**
1. Define canonical enums and fields in API source contract.
2. Expose machine-readable contract endpoint from API.
3. Use canonical constants in API upload/jobs flows.
4. Add UI contract resolver module and route all field reads through it.
5. Add worker contract references/constants and align docs.

**Detailed test plan**
1. Contract endpoint validation:
   - Call `GET /contract/job-status` and verify expected version/enums/fields.
2. UI compatibility validation:
   - Run OCR + Transcription happy paths and verify history/completion cards show canonical fields correctly.
3. Lifecycle field validation:
   - Verify Redis `job_status:<job_id>` contains `contract_version`, `job_type`, `status`, `stage`, `progress`, `updated_at`.

**Exit criteria for marking status**
- `Completed (Code)` when contract doc/endpoint/constants/resolvers exist across all repos.
- `Completed (Tested)` after local + cloud regression pass including OCR and transcription.

### PRS-003 - Define error-code catalog

**Purpose**
- Ensure failures are reported with deterministic `error_code` and user-safe `error_message` across worker, API, UI, and scripts.

**Why this is in Phase 0**
- Error consistency is foundational for supportability and user trust.

**Repo touchpoints: why and how each repo is changed**
- `doc-transcribe-worker`
  - Added centralized classifier: `worker/error_catalog.py`.
  - Worker failure/cancel paths now write consistent fields:
    - `error_code`
    - `error_message`
    - `error_detail`
    - `error`
  - Also updates processing stage from queued to explicit processing start.

- `doc-transcribe-api`
  - `routes/status.py` now normalizes failed payloads if worker misses fields:
    - default `error_code=PROCESSING_FAILED`
    - default `error_message` from `error/stage`.

- `doc-transcribe-ui`
  - `js/utils.js`: added unified failed-job message helper.
  - `js/polling.js`: uses consistent error helper for user toast.
  - Regression scripts now print `error_code` + `error_message` on failed jobs.

**Functional requirement served**
- Predictable error semantics.

**User benefit**
- Clear actionable failure messages instead of ambiguous/raw exceptions.

**Detailed implementation steps**
1. Add worker error classifier and emit stable codes/messages.
2. Normalize API status response for failure fields.
3. Consume those fields in UI failure rendering and regression scripts.

**Detailed test plan**
1. Trigger decode failure and verify `error_code=MEDIA_DECODE_FAILED`.
2. Trigger quota/resource failure and verify `error_code=RATE_LIMIT_EXCEEDED`.
3. Verify UI toast uses standardized message.
4. Verify regression scripts print `failed [ERROR_CODE]: message`.

**Exit criteria for marking status**
- `Completed (Code)` when worker/API/UI/scripts emit and consume standardized error fields.
- `Completed (Tested)` after local + cloud regression includes at least one forced failure scenario.

### PRS-004 - Add startup env validation

**Purpose**
- Add startup env validation to strengthen runtime stability.

**Why this is in Phase 0**
- Sequenced in Phase 0 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API, Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Runtime stability

**User benefit**
- Fewer production misconfig failures

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-005 - Correlation ID propagation (`request_id`)

**Purpose**
- Correlation ID propagation (`request_id`) to strengthen traceability.

**Why this is in Phase 1**
- Sequenced in Phase 1 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `UI, API, Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Traceability

**User benefit**
- Faster support/debug turnaround

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-006 - Structured JSON logging with mandatory fields

**Purpose**
- Structured JSON logging with mandatory fields to strengthen observability.

**Why this is in Phase 1**
- Sequenced in Phase 1 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API, Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Observability

**User benefit**
- Easier root-cause analysis

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-007 - Add operational metrics (success/fail/retry/latency)

**Purpose**
- Add operational metrics (success/fail/retry/latency) to strengthen monitoring.

**Why this is in Phase 1**
- Sequenced in Phase 1 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API, Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Monitoring

**User benefit**
- Detect issues before users report

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-008 - Enforce job status transition state machine

**Purpose**
- Enforce job status transition state machine to strengthen reliability.

**Why this is in Phase 2**
- Sequenced in Phase 2 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API, Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Reliability

**User benefit**
- Predictable job lifecycle behavior

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-009 - Add idempotent upload key and duplicate job reuse

**Purpose**
- Add idempotent upload key and duplicate job reuse to strengthen reliability.

**Why this is in Phase 2**
- Sequenced in Phase 2 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API, UI`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Reliability

**User benefit**
- No duplicate jobs on retry/network glitches

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-010 - Typed retry policy with backoff + jitter

**Purpose**
- Typed retry policy with backoff + jitter to strengthen reliability.

**Why this is in Phase 2**
- Sequenced in Phase 2 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Reliability

**User benefit**
- Better success under transient failures

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-011 - DLQ enrichment (`error_code`, `attempts`, stage)

**Purpose**
- DLQ enrichment (`error_code`, `attempts`, stage) to strengthen recoverability.

**Why this is in Phase 2**
- Sequenced in Phase 2 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Recoverability

**User benefit**
- Easier failed-job replay and diagnosis

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-012 - Global exception mapping to stable API payloads

**Purpose**
- Global exception mapping to stable API payloads to strengthen error consistency.

**Why this is in Phase 2**
- Sequenced in Phase 2 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Error consistency

**User benefit**
- Less confusing UI errors

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-013 - Tighten token validation (`iss`, `aud`, expiry)

**Purpose**
- Tighten token validation (`iss`, `aud`, expiry) to strengthen security.

**Why this is in Phase 3**
- Sequenced in Phase 3 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Security

**User benefit**
- Stronger auth correctness

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-014 - Environment-based strict CORS allowlist

**Purpose**
- Environment-based strict CORS allowlist to strengthen security.

**Why this is in Phase 3**
- Sequenced in Phase 3 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Security

**User benefit**
- Fewer CORS/auth surprises

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-015 - Server-side MIME/extension/size validation

**Purpose**
- Server-side MIME/extension/size validation to strengthen security and validation.

**Why this is in Phase 3**
- Sequenced in Phase 3 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Security and validation

**User benefit**
- Clear rejection of unsupported files

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-016 - Optimize `/jobs` pagination and counts path

**Purpose**
- Optimize `/jobs` pagination and counts path to strengthen performance.

**Why this is in Phase 4**
- Sequenced in Phase 4 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Performance

**User benefit**
- Faster history loading

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-017 - Reduce polling overhead and duplicate pollers

**Purpose**
- Reduce polling overhead and duplicate pollers to strengthen performance.

**Why this is in Phase 4**
- Sequenced in Phase 4 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `UI`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Performance

**User benefit**
- Smoother app under load

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-018 - Make worker chunk/page strategy configurable

**Purpose**
- Make worker chunk/page strategy configurable to strengthen performance.

**Why this is in Phase 4**
- Sequenced in Phase 4 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Performance

**User benefit**
- Better throughput and tuning flexibility

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-019 - Queue partitioning by workload (OCR vs A/V)

**Purpose**
- Queue partitioning by workload (OCR vs A/V) to strengthen scalability.

**Why this is in Phase 5**
- Sequenced in Phase 5 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API, Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Scalability

**User benefit**
- Reduced queue contention

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-020 - Worker concurrency controls by queue/type

**Purpose**
- Worker concurrency controls by queue/type to strengthen scalability.

**Why this is in Phase 5**
- Sequenced in Phase 5 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Scalability

**User benefit**
- Better concurrent user support

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-021 - Load test baseline (5/10 concurrent users)

**Purpose**
- Load test baseline (5/10 concurrent users) to strengthen capacity planning.

**Why this is in Phase 5**
- Sequenced in Phase 5 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `All`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Capacity planning

**User benefit**
- Predictable performance expectations

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-022 - Add readiness checks for dependencies

**Purpose**
- Add readiness checks for dependencies to strengthen operability.

**Why this is in Phase 6**
- Sequenced in Phase 6 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API, Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Operability

**User benefit**
- Safer deploys and faster fail detection

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-023 - Add runbooks for top failure scenarios

**Purpose**
- Add runbooks for top failure scenarios to strengthen operability.

**Why this is in Phase 6**
- Sequenced in Phase 6 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `All`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Operability

**User benefit**
- Faster incident resolution

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-024 - Add feature flags for risky changes

**Purpose**
- Add feature flags for risky changes to strengthen operability.

**Why this is in Phase 6**
- Sequenced in Phase 6 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API, Worker, UI`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Operability

**User benefit**
- Safe rollout and rollback

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-025 - Enforce limits/quotas (size/pages/duration/user)

**Purpose**
- Enforce limits/quotas (size/pages/duration/user) to strengthen cost control.

**Why this is in Phase 7**
- Sequenced in Phase 7 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Cost control

**User benefit**
- Stable service under abuse/spikes

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-026 - Retry/cost budgets by error type

**Purpose**
- Retry/cost budgets by error type to strengthen cost control.

**Why this is in Phase 7**
- Sequenced in Phase 7 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Cost control

**User benefit**
- Prevent expensive retry loops

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-027 - User-facing cost/effort hints for large jobs

**Purpose**
- User-facing cost/effort hints for large jobs to strengthen cost transparency.

**Why this is in Phase 7**
- Sequenced in Phase 7 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `UI`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Cost transparency

**User benefit**
- Better user expectations pre-upload

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-028 - Refactor API into layered modules

**Purpose**
- Refactor API into layered modules to strengthen maintainability.

**Why this is in Phase 8**
- Sequenced in Phase 8 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `API`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Maintainability

**User benefit**
- Easier long-term feature development

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-029 - Refactor Worker into orchestrator/adapters/executors

**Purpose**
- Refactor Worker into orchestrator/adapters/executors to strengthen maintainability.

**Why this is in Phase 8**
- Sequenced in Phase 8 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `Worker`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Maintainability

**User benefit**
- Clearer ownership and easier debugging

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-030 - Refactor UI into api-client/controllers/views/formatters

**Purpose**
- Refactor UI into api-client/controllers/views/formatters to strengthen maintainability.

**Why this is in Phase 8**
- Sequenced in Phase 8 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `UI`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Maintainability

**User benefit**
- Faster UI iteration with fewer regressions

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-031 - Add unit tests for core logic and formatters

**Purpose**
- Establish deterministic unit-level safety checks for the most reusable logic in API, Worker, and UI.

**Why this is in Phase 9**
- This phase converts refactoring gains from Phase 8 into enforceable quality gates before broader CI expansion (`PRS-033`).

**Repo touchpoints**
- API (`doc-transcribe-api`):
  - `tests/test_upload_orchestrator_unit.py`
  - Covers filename normalization, idempotency helpers, deterministic job-id hashing, and upload constraint validation.
- Worker (`doc-transcribe-worker`):
  - `tests/test_status_machine_unit.py`
  - `tests/test_error_catalog_unit.py`
  - Covers transition guard rules and exception-to-error-code classification.
- UI (`doc-transcribe-ui`):
  - `tests/job-contract.test.js`
  - `tests/utils-formatters.test.js`
  - `package.json` (`npm test`)
  - Covers canonical field resolution and formatter/request-id helper behavior.

**Functional requirement served**
- Prevent regressions in shared, high-reuse logic without waiting for full end-to-end runs.

**User benefit**
- More stable releases and fewer UI/API behavior drifts after refactors.

**Implementation outline**
1. Add unit-test files in each repo focused on pure/helper logic.
2. Keep production runtime paths unchanged; test-only additions.
3. Add a one-command UI test entry (`npm test`) with Node built-in test runner.
4. Update backlog/release notes with explicit validation commands and status.

**Detailed test plan**
1. API:
   - `cd /Users/arpitjain/PycharmProjects/doc-transcribe-api && .venv/bin/python -m unittest discover -s tests -p "test_*_unit.py"`
2. Worker:
   - `cd /Users/arpitjain/PycharmProjects/doc-transcribe-worker && .venv/bin/python -m unittest discover -s tests -p "test_*_unit.py"`
3. UI:
   - `cd /Users/arpitjain/VSProjects/doc-transcribe-ui && npm test`
4. Then run bounded local/cloud regression scripts before moving to `Completed (Tested)`.

**Exit criteria for marking status**
- `Completed (Code Complete)`: unit suites added and passing in all three repos.
- `Completed (Tested)`: local + cloud bounded regressions also pass and docs are updated.


### PRS-032 - Add integration tests for e2e job lifecycle

**Purpose**
- Ensure end-to-end lifecycle behavior is explicitly asserted (not only eventual completion), with reproducible evidence artifacts for each run.

**Why this is in Phase 9**
- Phase 9 formalizes quality gates after architecture and observability baselines are in place.

**Repo touchpoints**
- Scope: `All` through integration runners and cross-layer lifecycle checks.
- Implemented in UI repo scripts used to validate API + Worker behavior:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
- Added:
  - lifecycle sequence assertions (`QUEUED/PROCESSING` progression to `COMPLETED`)
  - machine-readable integration evidence files (`integration-local-*.jsonl`, `integration-cloud-*.jsonl`)

**Functional requirement served**
- Quality and release confidence through explicit e2e lifecycle certification.

**User benefit**
- Fewer “false green” regressions because lifecycle transitions and evidence are validated every run.

**Implementation outline**
1. Extend local/cloud regression pollers to capture unique status sequences per job.
2. Assert lifecycle integrity before passing each OCR/TRANSCRIPTION scenario.
3. Emit integration report entries including `scenario`, `job_id`, `request_id`, `status_sequence`, `duration_sec`, `result`.
4. Surface report path in console logs for traceable handoff.

**Detailed test plan**
1. Run local: `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
2. Confirm output includes:
   - lifecycle certified trace lines
   - `Integration report written: ...integration-local-*.jsonl`
3. Run cloud: `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
4. Confirm output includes:
   - lifecycle certified trace lines
   - `Integration report written: ...integration-cloud-*.jsonl`

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.


### PRS-033 - Add CI gates (`lint`, tests, contract checks)

**Purpose**
- Add CI gates (`lint`, tests, contract checks) to strengthen quality governance.

**Why this is in Phase 9**
- Sequenced in Phase 9 per dependency and rollout risk in the backlog.

**Repo touchpoints**
- Scope: `All`.
- Implementation must preserve canonical contract, logging standards, and backward compatibility.

**Functional requirement served**
- Quality governance

**User benefit**
- Stable releases

**Implementation outline**
1. Add/adjust modules in listed repos for this capability.
2. Add stage-level logs for start/completed/failed transitions with identifiers (`job_id`, `request_id` when available).
3. Keep API payloads backward compatible; add feature flags where rollout risk exists.
4. Update docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`) with traceable changes.

**Detailed test plan**
1. Run mandatory functional suite from `FUNCTIONAL_REGRESSION_TESTS.md`.
2. Run local bounded regression (OCR + Transcription).
3. Run cloud bounded regression with the same commit.
4. Validate logs contain expected identifiers and stage transitions for this item.

**Exit criteria for marking status**
- `Completed (Code)`: code and docs updated in scoped repos.
- `Completed (Tested)`: local + cloud regression green and backlog/test/release docs updated.

### PRS-034 - Add user-centric file and method comments across code/config files

**Purpose**
- Add short, user-centric comments so each file/function quickly explains how it helps users complete OCR/transcription successfully.

**Why this is in Phase 8**
- This is a maintainability and supportability improvement tied to modularization quality in Phase 8.

**Repo touchpoints**
- Scope: `All` (`UI`, `API`, `Worker`).
- File-level comments added for tracked `.js`, `.html`, `.css`, `.py`, `.yaml`, `.yml` files.
- Method/function-level comments added where methods exist (`.py` and `.js`).

**Functional requirement served**
- Maintainability and supportability

**User benefit**
- Faster issue triage and safer changes, leading to fewer OCR/transcription regressions in user-facing flows.

**Implementation outline**
1. Add a crisp file-top comment (1 line) describing user value.
2. Add a crisp method-level comment (1 line) before each function/method where applicable.
3. Keep comments idempotent and non-duplicative when rerun.
4. Keep syntax-safe across Python/JS/HTML/CSS/YAML.

**Detailed test plan**
1. Run Python syntax validation for API/Worker tracked `.py` files (`py_compile`).
2. Run local bounded regression script.
3. Run cloud bounded regression script.

**Exit criteria for marking status**
- `Completed (Code)`: comments added across scoped files with syntax validation passing.
- `Completed (Tested)`: local + cloud regression green and docs updated.


### PRS-035 - Smart Intake Agent (auto-routing + prechecks + ETA)

**Purpose**
- Automatically choose the best OCR/transcription path before enqueue to reduce avoidable failures and improve perceived speed.

**Why this is in Phase 10**
- Built after core reliability and observability so routing decisions can be measured and safely rolled out.

**Repo touchpoints**
- `UI`, `API`

**Detailed test plan**
1. Submit mixed file types and verify correct route selection.
2. Validate precheck warning quality (size/type/page/duration guidance).
3. Compare ETA estimates vs actual completion distribution.

### PRS-036 - OCR Quality Agent (confidence scoring + page-level guidance)

**Purpose**
- Score OCR quality and provide actionable next steps when scan quality is low.

**Why this is in Phase 10**
- Requires stable OCR pipeline and normalized error/metrics baselines.

**Repo touchpoints**
- `Worker`, `API`, `UI`

**Detailed test plan**
1. Run low/high-quality PDFs and compare confidence signal behavior.
2. Verify page-level issue hints in status/history payloads.
3. Confirm UI guidance suggests practical remediation.

### PRS-037 - Transcription Quality Agent (segment confidence + noise/speaker hints)

**Purpose**
- Detect weak transcript segments and highlight noise/speaker issues with reprocessing advice.

**Why this is in Phase 10**
- Requires chunking, retries, and status stages already stabilized.

**Repo touchpoints**
- `Worker`, `API`, `UI`

**Detailed test plan**
1. Run noisy and clean audio samples.
2. Verify segment confidence and quality flags in output metadata.
3. Validate user guidance for improve-and-retry loop.

### PRS-038 - Retry & Recovery Agent (policy-driven recovery orchestration)

**Purpose**
- Move from static retries to context-aware recovery actions per error class.

**Why this is in Phase 10**
- Depends on typed error catalog and retry budget foundations.

**Repo touchpoints**
- `Worker`, `API`

**Detailed test plan**
1. Inject transient provider/network failures.
2. Confirm recovery path chosen by policy and bounded attempts.
3. Validate DLQ contains recovery decision trace.

### PRS-039 - Cost Guardrail Agent (quota/cost prediction + enforcement)

**Purpose**
- Predict cost impact and enforce budget-aware controls before expensive jobs run.

**Why this is in Phase 10**
- Extends quota/limit groundwork with predictive decisioning.

**Repo touchpoints**
- `API`, `UI`

**Detailed test plan**
1. Validate cost/effort projection for diverse media/page sizes.
2. Confirm threshold breaches trigger clear policy outcomes.
3. Ensure user messaging stays deterministic and actionable.

### PRS-040 - Queue Orchestration Agent (dynamic balancing/prioritization)

**Purpose**
- Dynamically rebalance queue consumption to minimize starvation and reduce p95 wait.

**Why this is in Phase 10**
- Requires partitioned queues and concurrency controls already implemented.

**Repo touchpoints**
- `Worker`, `API`

**Detailed test plan**
1. Load-test mixed OCR/A-V traffic.
2. Compare queue wait percentiles before/after.
3. Confirm fairness and no starvation under bursts.

### PRS-041 - User Assist Agent (in-flow guidance + next-best action)

**Purpose**
- Give context-aware recommendations during upload, wait, and failure states.

**Why this is in Phase 10**
- Uses matured telemetry and error semantics for reliable guidance.

**Repo touchpoints**
- `UI`, `API`

**Detailed test plan**
1. Simulate queued, failed, and cancelled scenarios.
2. Verify guidance relevance and clarity.
3. Measure completion improvement in guided flows.

### PRS-042 - Incident Triage Agent (cross-layer root-cause assistant)

**Purpose**
- Automatically map an incident to probable root cause using cross-layer traces.

**Why this is in Phase 10**
- Depends on request_id/job_id propagation and structured logs.

**Repo touchpoints**
- `API`, `Worker`, `UI/scripts`

**Detailed test plan**
1. Replay known failure cases.
2. Validate triage output links evidence across layers.
3. Confirm generated runbook action list correctness.

### PRS-043 - Regression Certification Agent (auto-certify release readiness)

**Purpose**
- Automate release go/no-go based on functional, contract, and CI evidence.

**Why this is in Phase 10**
- Uses complete test/CI baseline delivered in prior phases.

**Repo touchpoints**
- `UI/scripts`, `API`, `Worker`

**Detailed test plan**
1. Run local/cloud regression and CI checks.
2. Validate generated certification report and gating verdict.
3. Confirm failed checks block certification output.

### PRS-044 - Product Insights Agent (usage/failure analytics + prioritization)

**Purpose**
- Convert usage and failure signals into prioritized product and UX actions.

**Why this is in Phase 10**
- Needs stable metrics/logging contracts for trustworthy insights.

**Repo touchpoints**
- `API`, `Worker`, `UI`

**Detailed test plan**
1. Generate periodic insight reports from real run data.
2. Validate top findings against observed incidents/feedback.
3. Confirm backlog recommendations are specific and actionable.

### PRS-045 - BIG EPIC: Digambar Jainism GPT using RAG

**Purpose**
- Build a production-grade GPT assistant grounded in Digambar Jainism source material using RAG (Retrieval-Augmented Generation).

**Why this is in Phase 11**
- This is a larger strategic initiative and should begin after Phase 10 agentic foundations (`PRS-035` to `PRS-044`) are complete and stable.

**Repo touchpoints**
- `All`:
  - `UI`: domain search/chat UX, citations view, feedback loop.
  - `API`: query orchestration, retrieval APIs, prompt grounding, policy/safety filters.
  - `Worker`: ingestion/indexing pipelines, chunking, embedding generation, refresh jobs.

**Functional requirement served**
- Domain-specific trustworthy AI assistant for Digambar Jainism concepts.

**User benefit**
- Users get faster, source-grounded answers with citation links and reduced hallucinations.

**Implementation outline**
1. Corpus strategy: identify trusted Digambar Jain texts and metadata schema.
2. Ingestion pipeline: normalize OCR/transcripts, clean text, chunk, tag by source/topic.
3. Retrieval layer: embeddings + hybrid retrieval + reranking.
4. Grounded response layer: prompt templates with strict citation-first output.
5. Safety and policy: relevance filtering, refusal rules, confidence thresholds.
6. Evaluation: benchmark Q/A sets, faithfulness/groundedness scoring, regression suite.
7. Productization: observability, feedback capture, periodic re-indexing workflow.

**Detailed test plan**
1. Gold-set evaluation on representative Digambar Jainism questions.
2. Citation correctness checks (answer claims must map to retrieved passages).
3. Hallucination guard tests on out-of-scope/ambiguous queries.
4. Latency/cost benchmarks for retrieval and generation.
5. End-to-end local + cloud regression with representative corpus snapshots.


### PRS-046A - Operations Dashboard (real-time reliability + incident triage)

**Purpose**
- Provide one operations dashboard for engineering/support to monitor OCR/transcription health and respond quickly to incidents.

**Why this is in Phase 6**
- Depends on readiness, structured logging, and metrics baselines from operability hardening.

**Repo touchpoints**
- `API`, `Worker`, `UI`
  - `API`: operational metrics endpoints, error/failure aggregation, SLO snapshot APIs.
  - `Worker`: queue/inflight/retry/DLQ + dependency health telemetry.
  - `UI`: ops dashboard views with filters and drilldowns.

**Recommended ops features**
1. Live queue panel: queue depth, inflight, oldest queued age, pickup lag.
2. Job funnel: `QUEUED -> PROCESSING -> COMPLETED/FAILED/CANCELLED` rates by type.
3. Failure taxonomy: top `error_code`, stage, provider/component breakdown.
4. Latency and SLOs: p50/p95 end-to-end and stage-level timings by OCR/A-V.
5. Dependency/provider health: Redis/GCS/model/API readiness and error-rate trends.
6. Release quality widget: latest local/cloud regression + CI health.

**Detailed test plan**
1. Validate each ops widget against raw metrics/log samples.
2. Simulate known failures and verify dashboard visibility within expected lag.
3. Run load baseline and verify queue/latency/SLO charts update correctly.
4. Validate filter/drilldown accuracy by job type, status, and time window.

### PRS-046B - Product Analytics Dashboard (usage + outcomes + cost)

**Purpose**
- Provide a product dashboard for adoption, completion outcomes, and cost/limit behavior to guide roadmap decisions.

**Why this is in Phase 6**
- Product insights are strongest when operational telemetry is already reliable.

**Repo touchpoints**
- `API`, `Worker`, `UI`
  - `API`: aggregated usage/outcome/cost endpoints.
  - `Worker`: processing duration and quality outcome metrics.
  - `UI`: product analytics screens and export views.

**Recommended product features**
1. Active users and new vs returning user trend.
2. Completion/drop-off funnel by workflow stage.
3. Median and p95 turnaround by OCR vs A/V.
4. Quota/cost trend and rejection reason distribution.
5. Cohort retention and repeat usage by period.
6. Top user pain points (most frequent actionable errors).

**Detailed test plan**
1. Validate product KPIs against source events and sampled jobs.
2. Verify cohort and funnel math with fixed fixture windows.
3. Confirm cost/quota trend correctness against policy counters.
4. Verify dashboard performance and filter responsiveness on larger datasets.
