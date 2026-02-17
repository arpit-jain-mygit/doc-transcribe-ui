# Production Readiness Impact Guide

This guide explains each backlog item in plain English:
- What happens if we do not do it
- What improves after doing it
- High-level implementation direction (architecture/design/implementation)
- Who benefits most

Primary source backlog: `/Users/arpitjain/VSProjects/doc-transcribe-ui/PRODUCTION_READINESS_BACKLOG.md`

## Phase 0
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-001 | Team works with assumptions; onboarding is slow and inconsistent. | Common engineering rules reduce confusion and rework. | Before: new dev asks where status logic lives. After: follows architecture doc + contribution rules and ships safely in first PR. | Architecture boundaries, coding standards, contribution checklist, regression process docs. | Developers, reviewers, new joiners, PM |
| PRS-002 | UI/API/Worker drift on field names and status meanings. | One contract reduces integration bugs. | Before: UI reads `type`, worker writes `job_type`. After: both use canonical contract fields consistently. | Canonical status/field contract as source of truth + endpoint and references. | Developers, testers, ops |
| PRS-003 | Errors look random and hard to act on. | Stable error codes/messages enable clear handling. | Before: `Connection closed by server.` After: `PROCESSING_FAILED` with user-friendly message + traceable detail for ops. | Central error catalog and normalized payload mapping across services. | End users, support, testers, developers |
| PRS-004 | Misconfigured deployments fail during live traffic. | Fast startup validation catches bad config early. | Before: first upload fails because env var missing. After: service refuses startup with clear missing-key list. | Fail-fast environment validators on API/Worker startup. | Ops, developers, PM |

## Phase 1
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-005 | Tracing one user request across systems is slow and manual. | Single `request_id` gives end-to-end traceability. | Before: search logs by filename/time window. After: grep one `request_id` and get full flow instantly. | Correlation ID propagation in UI headers, API, Redis status, worker logs. | Ops, developers, support |
| PRS-006 | Logs are noisy text and hard to query/aggregate. | Structured logs make root-cause analysis faster. | Before: mixed plain text lines. After: JSON logs filterable by `job_id`, `stage`, `event`. | JSON logging with mandatory fields and stage events in API/Worker. | Ops, developers, testers |
| PRS-007 | Failures are found late by users. | Metrics reveal issues early (latency/retry/fail rates). | Before: user reports slowdown. After: dashboard shows p95 latency spike and retry surge before complaint. | API/Worker counters and timers + metrics endpoint exposure. | Ops, PM, developers |
| PRS-008 | Invalid status jumps create confusing lifecycle behavior. | Predictable state transitions improve reliability. | Before: job goes `COMPLETED -> PROCESSING` due to race. After: transition blocked by state machine guard. | Guarded status transition state-machine in API and worker writes. | End users, testers, developers |

## Phase 2
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-009 | Retries can create duplicate jobs and wasted processing. | Safe retries reuse existing job. | Before: double-tap upload makes 2 jobs. After: same idempotency key returns existing `job_id` with `reused=true`. | Idempotency key handling + duplicate detection + enqueue-once guard. | End users, ops, PM |
| PRS-010 | Retries are inconsistent and can overload dependencies. | Controlled retry behavior improves resilience/cost. | Before: immediate retry storm on transient Redis/GCS failures. After: typed exponential backoff + jitter smooths load. | Typed retry policy with bounded backoff and jitter by failure type. | Ops, developers |
| PRS-011 | DLQ records lack context for replay/debug. | Faster recovery from failed jobs. | Before: DLQ says only FAILED. After: DLQ includes `error_code`, `attempts`, `stage`, making replay targeted. | Enrich DLQ payload with attempts, stage, error code, timing metadata. | Ops, support, developers |
| PRS-012 | API error payloads vary by code path. | UI and tests can rely on stable failure schema. | Before: sometimes `detail`, sometimes raw traceback. After: consistent `{error_code, error_message, request_id}` envelope. | Global exception mapper to canonical error envelope. | End users, testers, developers |

## Phase 3
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-013 | Token checks may be incomplete (security gap). | Stronger auth correctness and safer access. | Before: token with wrong audience may slip through. After: strict `iss/aud/exp` validation rejects it cleanly. | Strict JWT validation (`iss`, `aud`, expiry, skew policy). | End users, security, ops |
| PRS-014 | CORS behavior differs by environment and causes breakage. | Predictable browser access by environment. | Before: mobile browser fails with CORS randomly. After: explicit allowlist per env gives deterministic behavior. | Strict environment-based CORS allowlist and config checks. | End users, developers, ops |
| PRS-015 | Unsupported/oversized files fail late in processing. | Early rejection with clear messages. | Before: 2GB file enters queue then fails. After: upload blocked immediately with actionable message. | Server-side MIME/extension/size validation before queueing. | End users, ops, PM |

## Phase 4
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-016 | History loading gets slow as data grows. | Faster and scalable history UX. | Before: history tab stalls with 500+ jobs. After: first page loads fast with accurate counts. | Efficient pagination/count queries and indexed access path. | End users, ops |
| PRS-017 | Too many pollers increase API load and jitter. | Smoother UI and lower backend pressure. | Before: duplicate pollers send many `/status` calls. After: one active poller per job lifecycle. | Polling dedupe, adaptive intervals, lifecycle cleanup. | End users, ops |
| PRS-018 | Processing strategy is fixed and hard to tune. | Better throughput tuning by workload profile. | Before: same chunk size for short and long media. After: configurable strategy tuned by env/profile. | Configurable chunk/page strategy and limits in worker. | Ops, developers, PM |

## Phase 5
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-019 | OCR and A/V jobs contend on one queue. | Workload isolation improves tail latency. | Before: one large audio blocks OCR jobs. After: OCR queue keeps moving independently. | Queue partition by workload and routing policy in API/Worker. | End users, ops |
| PRS-020 | One worker profile handles all tasks inefficiently. | Better concurrency control and stability. | Before: CPU-heavy and I/O-heavy tasks fight for same slots. After: tuned worker concurrency per queue/type. | Per-queue/type worker concurrency and capacity settings. | Ops, PM |
| PRS-021 | Capacity expectations are guesswork. | Known baseline for 5/10 concurrent users. | Before: “should be fine” estimate. After: measured throughput/latency numbers for planning. | Repeatable load-test scenarios with accepted SLO outputs. | PM, ops, developers |

## Phase 6
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-022 | Service reports healthy while dependencies are down. | Safer deploy and better fail detection. | Before: `/health` OK but Redis dead. After: readiness fails and traffic does not shift. | Readiness checks for Redis/GCS/Vertex and startup gates. | Ops, developers |
| PRS-023 | Incident response depends on tribal knowledge. | Faster and consistent recovery. | Before: “ask X person” during outage. After: runbook provides exact diagnose/recover steps. | Runbooks for top failure modes with exact commands/decision tree. | Ops, support, PM |
| PRS-024 | High-risk changes require full rollback. | Controlled rollout and quick mitigation. | Before: bad release needs immediate full rollback. After: feature flag off restores stability quickly. | Feature flags around risky paths with clear defaults. | PM, ops, developers |

## Phase 7
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-025 | Cost spikes and abuse can degrade service. | Stable service and predictable spending. | Before: one user uploads many huge files and impacts everyone. After: quota limits throttle abuse safely. | Enforce limits/quotas by file size/pages/duration/user scope. | Ops, PM |
| PRS-026 | Retries can silently burn budget. | Retry spend stays controlled. | Before: repeated 429 retries keep burning tokens/cost. After: capped retry budget stops runaway spend. | Budget-aware retry caps by error class and provider response. | Ops, PM |
| PRS-027 | Users submit huge jobs without expectation setting. | Better trust and fewer complaints. | Before: user expects 1 minute for large file. After: UI warns realistic effort before submit. | UI hints for effort/cost/time before upload submit. | End users, PM, support |

## Phase 8
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-028 | API complexity grows and changes become risky. | Cleaner API changes with lower regression risk. | Before: changing upload path risks jobs/status APIs. After: layered boundaries isolate changes safely. | Layered API refactor (routes/services/adapters/contracts). | Developers, testers |
| PRS-029 | Worker ownership is unclear during failures. | Easier debugging and modular evolution. | Before: failure can come from any mixed module. After: clear orchestrator/adapters split narrows root cause fast. | Refactor worker into orchestrator/adapters/executors. | Developers, ops |
| PRS-030 | UI logic coupling slows feature delivery. | Faster and safer UI iteration. | Before: one UI change touches many unrelated files. After: view/controller/api-client separation reduces blast radius. | UI module split (api-client/controllers/views/formatters). | Developers, PM, testers |

## Phase 9
| ID | If Not Done | After Done | Real Example (Before -> After) | High-Level Implementation | Main Beneficiaries |
|---|---|---|---|---|---|
| PRS-031 | Small code changes can break core logic unnoticed. | Faster feedback on logic regressions. | Before: formatter bug found in production. After: unit test fails during development. | Unit tests for formatters/helpers/status/validation logic. | Developers, testers |
| PRS-032 | End-to-end flow can fail despite passing unit tests. | Higher release confidence for real workflows. | Before: upload succeeds but status polling breaks after deploy. After: integration test catches full lifecycle regression. | Integration tests for upload->queue->worker->status->download lifecycle. | Testers, PM, developers |
| PRS-033 | Quality depends on manual discipline. | Consistent release quality gates. | Before: untested code merges on Friday. After: CI blocks merge until lint/tests/contracts pass. | CI gates for lint/tests/contract checks as merge requirements. | PM, developers, ops |
