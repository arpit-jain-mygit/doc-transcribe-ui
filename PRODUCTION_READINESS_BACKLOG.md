# Production Readiness & Scalability Backlog

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

## Backlog

| ID | Phase | Task | Repo | Functional Requirement Served | User Benefit | Status | Test | Repo-wise Change Summary |
|---|---|---|---|---|---|---|---|---|
| PRS-001 | 0 | Define architecture boundaries and coding standards | All | Maintainability | Faster onboarding for new engineers | Completed (Tested) | Completed (Local + Cloud Regression) | UI: architecture/backlog/regression docs + stack/regression scripts. API: stage-wise structured logging + logging config. Worker: architecture/contribution/guide docs and module map docs. |
| PRS-002 | 0 | Define canonical job/status field contract | All | Data consistency | Fewer UI/API/Worker mismatch bugs | Completed (Code) | Not Tested | UI: added canonical contract resolver module and contract reference doc. API: added source-of-truth contract spec + machine-readable contract endpoint + canonical constants in routes. Worker: added contract constants/reference docs aligned to API source. |
| PRS-003 | 0 | Define error-code catalog | All | Predictable error handling | Clearer, actionable error messages | Completed (Code) | Not Tested | UI: standardized failed-job message rendering + script failure output includes error code/message. API: failed status normalization (`error_code`,`error_message`). Worker: centralized error classification and consistent failed/cancelled fields. |
| PRS-004 | 0 | Add startup env validation | API, Worker | Runtime stability | Fewer production misconfig failures | Planned | Not Tested | Pending implementation |
| PRS-005 | 1 | Correlation ID propagation (`request_id`) | UI, API, Worker | Traceability | Faster support/debug turnaround | Planned | Not Tested | Pending implementation |
| PRS-006 | 1 | Structured JSON logging with mandatory fields | API, Worker | Observability | Easier root-cause analysis | Planned | Not Tested | Pending implementation |
| PRS-007 | 1 | Add operational metrics (success/fail/retry/latency) | API, Worker | Monitoring | Detect issues before users report | Planned | Not Tested | Pending implementation |
| PRS-008 | 2 | Enforce job status transition state machine | API, Worker | Reliability | Predictable job lifecycle behavior | Planned | Not Tested | Pending implementation |
| PRS-009 | 2 | Add idempotent upload key and duplicate job reuse | API, UI | Reliability | No duplicate jobs on retry/network glitches | Planned | Not Tested | Pending implementation |
| PRS-010 | 2 | Typed retry policy with backoff + jitter | Worker | Reliability | Better success under transient failures | Planned | Not Tested | Pending implementation |
| PRS-011 | 2 | DLQ enrichment (`error_code`, `attempts`, stage) | Worker | Recoverability | Easier failed-job replay and diagnosis | Planned | Not Tested | Pending implementation |
| PRS-012 | 2 | Global exception mapping to stable API payloads | API | Error consistency | Less confusing UI errors | Planned | Not Tested | Pending implementation |
| PRS-013 | 3 | Tighten token validation (`iss`, `aud`, expiry) | API | Security | Stronger auth correctness | Planned | Not Tested | Pending implementation |
| PRS-014 | 3 | Environment-based strict CORS allowlist | API | Security | Fewer CORS/auth surprises | Planned | Not Tested | Pending implementation |
| PRS-015 | 3 | Server-side MIME/extension/size validation | API | Security and validation | Clear rejection of unsupported files | Planned | Not Tested | Pending implementation |
| PRS-016 | 4 | Optimize `/jobs` pagination and counts path | API | Performance | Faster history loading | Planned | Not Tested | Pending implementation |
| PRS-017 | 4 | Reduce polling overhead and duplicate pollers | UI | Performance | Smoother app under load | Planned | Not Tested | Pending implementation |
| PRS-018 | 4 | Make worker chunk/page strategy configurable | Worker | Performance | Better throughput and tuning flexibility | Planned | Not Tested | Pending implementation |
| PRS-019 | 5 | Queue partitioning by workload (OCR vs A/V) | API, Worker | Scalability | Reduced queue contention | Planned | Not Tested | Pending implementation |
| PRS-020 | 5 | Worker concurrency controls by queue/type | Worker | Scalability | Better concurrent user support | Planned | Not Tested | Pending implementation |
| PRS-021 | 5 | Load test baseline (5/10 concurrent users) | All | Capacity planning | Predictable performance expectations | Planned | Not Tested | Pending implementation |
| PRS-022 | 6 | Add readiness checks for dependencies | API, Worker | Operability | Safer deploys and faster fail detection | Planned | Not Tested | Pending implementation |
| PRS-023 | 6 | Add runbooks for top failure scenarios | All | Operability | Faster incident resolution | Planned | Not Tested | Pending implementation |
| PRS-024 | 6 | Add feature flags for risky changes | API, Worker, UI | Operability | Safe rollout and rollback | Planned | Not Tested | Pending implementation |
| PRS-025 | 7 | Enforce limits/quotas (size/pages/duration/user) | API | Cost control | Stable service under abuse/spikes | Planned | Not Tested | Pending implementation |
| PRS-026 | 7 | Retry/cost budgets by error type | Worker | Cost control | Prevent expensive retry loops | Planned | Not Tested | Pending implementation |
| PRS-027 | 7 | User-facing cost/effort hints for large jobs | UI | Cost transparency | Better user expectations pre-upload | Planned | Not Tested | Pending implementation |
| PRS-028 | 8 | Refactor API into layered modules | API | Maintainability | Easier long-term feature development | Planned | Not Tested | Pending implementation |
| PRS-029 | 8 | Refactor Worker into orchestrator/adapters/executors | Worker | Maintainability | Clearer ownership and easier debugging | Planned | Not Tested | Pending implementation |
| PRS-030 | 8 | Refactor UI into api-client/controllers/views/formatters | UI | Maintainability | Faster UI iteration with fewer regressions | Planned | Not Tested | Pending implementation |
| PRS-031 | 9 | Add unit tests for core logic and formatters | All | Quality | Prevents regressions | Planned | Not Tested | Pending implementation |
| PRS-032 | 9 | Add integration tests for e2e job lifecycle | All | Quality | Confidence before deploy | Planned | Not Tested | Pending implementation |
| PRS-033 | 9 | Add CI gates (`lint`, tests, contract checks) | All | Quality governance | Stable releases | Planned | Not Tested | Pending implementation |

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
- 2026-02-16: PRS-002 implemented at code/documentation level across UI/API/Worker; validation pending.
- 2026-02-16: PRS-003 implemented at code level across UI/API/Worker/scripts; validation pending.

## Detailed Item Specifications

### Table of contents
- [PRS-001 - Define architecture boundaries and coding standards](#prs-001---define-architecture-boundaries-and-coding-standards)
- [PRS-002 - Define canonical job/status field contract](#prs-002---define-canonical-jobstatus-field-contract)
- [PRS-003 - Define error-code catalog](#prs-003---define-error-code-catalog)

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
