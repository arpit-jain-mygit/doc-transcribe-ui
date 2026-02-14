# Production Readiness & Scalability Backlog

Status values:
- `Planned`
- `In Progress`
- `Completed (Code)`
- `Completed (Tested)`

## How to use
- Update `Status` when implementation starts/completes.
- Update `Test` only after local + integration verification.
- Keep repo scope explicit: `UI`, `API`, `Worker`, or `All`.

## Backlog

| ID | Phase | Task | Repo | Functional Requirement Served | User Benefit | Status | Test |
|---|---|---|---|---|---|---|---|
| PRS-001 | 0 | Define architecture boundaries and coding standards | All | Maintainability | Faster onboarding for new engineers | Planned | Not Tested |
| PRS-002 | 0 | Define canonical job/status field contract | All | Data consistency | Fewer UI/API/Worker mismatch bugs | Planned | Not Tested |
| PRS-003 | 0 | Define error-code catalog | All | Predictable error handling | Clearer, actionable error messages | Planned | Not Tested |
| PRS-004 | 0 | Add startup env validation | API, Worker | Runtime stability | Fewer production misconfig failures | Planned | Not Tested |
| PRS-005 | 1 | Correlation ID propagation (`request_id`) | UI, API, Worker | Traceability | Faster support/debug turnaround | Planned | Not Tested |
| PRS-006 | 1 | Structured JSON logging with mandatory fields | API, Worker | Observability | Easier root-cause analysis | Planned | Not Tested |
| PRS-007 | 1 | Add operational metrics (success/fail/retry/latency) | API, Worker | Monitoring | Detect issues before users report | Planned | Not Tested |
| PRS-008 | 2 | Enforce job status transition state machine | API, Worker | Reliability | Predictable job lifecycle behavior | Planned | Not Tested |
| PRS-009 | 2 | Add idempotent upload key and duplicate job reuse | API, UI | Reliability | No duplicate jobs on retry/network glitches | Planned | Not Tested |
| PRS-010 | 2 | Typed retry policy with backoff + jitter | Worker | Reliability | Better success under transient failures | Planned | Not Tested |
| PRS-011 | 2 | DLQ enrichment (`error_code`, `attempts`, stage) | Worker | Recoverability | Easier failed-job replay and diagnosis | Planned | Not Tested |
| PRS-012 | 2 | Global exception mapping to stable API payloads | API | Error consistency | Less confusing UI errors | Planned | Not Tested |
| PRS-013 | 3 | Tighten token validation (`iss`, `aud`, expiry) | API | Security | Stronger auth correctness | Planned | Not Tested |
| PRS-014 | 3 | Environment-based strict CORS allowlist | API | Security | Fewer CORS/auth surprises | Planned | Not Tested |
| PRS-015 | 3 | Server-side MIME/extension/size validation | API | Security and validation | Clear rejection of unsupported files | Planned | Not Tested |
| PRS-016 | 4 | Optimize `/jobs` pagination and counts path | API | Performance | Faster history loading | Planned | Not Tested |
| PRS-017 | 4 | Reduce polling overhead and duplicate pollers | UI | Performance | Smoother app under load | Planned | Not Tested |
| PRS-018 | 4 | Make worker chunk/page strategy configurable | Worker | Performance | Better throughput and tuning flexibility | Planned | Not Tested |
| PRS-019 | 5 | Queue partitioning by workload (OCR vs A/V) | API, Worker | Scalability | Reduced queue contention | Planned | Not Tested |
| PRS-020 | 5 | Worker concurrency controls by queue/type | Worker | Scalability | Better concurrent user support | Planned | Not Tested |
| PRS-021 | 5 | Load test baseline (5/10 concurrent users) | All | Capacity planning | Predictable performance expectations | Planned | Not Tested |
| PRS-022 | 6 | Add readiness checks for dependencies | API, Worker | Operability | Safer deploys and faster fail detection | Planned | Not Tested |
| PRS-023 | 6 | Add runbooks for top failure scenarios | All | Operability | Faster incident resolution | Planned | Not Tested |
| PRS-024 | 6 | Add feature flags for risky changes | API, Worker, UI | Operability | Safe rollout and rollback | Planned | Not Tested |
| PRS-025 | 7 | Enforce limits/quotas (size/pages/duration/user) | API | Cost control | Stable service under abuse/spikes | Planned | Not Tested |
| PRS-026 | 7 | Retry/cost budgets by error type | Worker | Cost control | Prevent expensive retry loops | Planned | Not Tested |
| PRS-027 | 7 | User-facing cost/effort hints for large jobs | UI | Cost transparency | Better user expectations pre-upload | Planned | Not Tested |
| PRS-028 | 8 | Refactor API into layered modules | API | Maintainability | Easier long-term feature development | Planned | Not Tested |
| PRS-029 | 8 | Refactor Worker into orchestrator/adapters/executors | Worker | Maintainability | Clearer ownership and easier debugging | Planned | Not Tested |
| PRS-030 | 8 | Refactor UI into api-client/controllers/views/formatters | UI | Maintainability | Faster UI iteration with fewer regressions | Planned | Not Tested |
| PRS-031 | 9 | Add unit tests for core logic and formatters | All | Quality | Prevents regressions | Planned | Not Tested |
| PRS-032 | 9 | Add integration tests for e2e job lifecycle | All | Quality | Confidence before deploy | Planned | Not Tested |
| PRS-033 | 9 | Add CI gates (`lint`, tests, contract checks) | All | Quality governance | Stable releases | Planned | Not Tested |

## Execution order
1. Phase 1 + Phase 2
2. Phase 3
3. Phase 4
4. Phase 8 + Phase 9
5. Phase 5 + Phase 6 + Phase 7

## Update log
- 2026-02-14: Backlog initialized.

## Detailed Item Specifications

### Table of contents
- [PRS-001 - Define architecture boundaries and coding standards](#prs-001---define-architecture-boundaries-and-coding-standards)

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
