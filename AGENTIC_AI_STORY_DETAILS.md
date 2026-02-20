# Agentic AI Story Details (All Agents)

This document provides a consistent detail block for **each story of each agent**.
For every story, coverage includes:
- Stage (when agent logic is used)
- Before (pain)
- After (improvement)
- High-level implementation
- Trigger / call hierarchy
- Stakeholder impact
- User-visible example

## Agent #1 - Smart Intake Agent (PRS-035)

### Story 1 - Intake contract
- Stage: Pre-upload
- Before: No stable intake schema.
- After: Stable fields for route/warnings/ETA/confidence/reasons.
- High-level implementation: API request/response schema + UI contract resolver.
- Trigger / call hierarchy: `file select/drop -> UI precheck call -> API schema validation -> response`.
- Stakeholder impact: Dev/testing contract drift reduced.
- User-visible example: route and ETA shown before upload.

### Story 2 - Feature flag wiring
- Stage: Rollout control
- Before: No safe toggle.
- After: `FEATURE_SMART_INTAKE` supports enable/disable rollout.
- High-level implementation: API env validation + UI capability check.
- Trigger / call hierarchy: `startup -> read flag -> runtime branch`.
- Stakeholder impact: Ops can rollback quickly.
- User-visible example: precheck appears only when enabled.

### Story 3 - Deterministic route detection
- Stage: Pre-upload classification
- Before: Implicit route decisions.
- After: Rule-based explainable route + confidence.
- High-level implementation: extension/mime routing service.
- Trigger / call hierarchy: `precheck endpoint -> route detector -> route+reasons`.
- Stakeholder impact: Product/ops can explain behavior.
- User-visible example: `TRANSCRIPTION` detected for `audio/*`.

### Story 4 - Precheck warnings
- Stage: Before enqueue
- Before: Failures discovered late.
- After: Early warnings for file size/pages/duration.
- High-level implementation: warning evaluator in intake service.
- Trigger / call hierarchy: `precheck -> warning rules -> warning payload`.
- Stakeholder impact: Fewer avoidable failures.
- User-visible example: warn toast for oversized input.

### Story 5 - ETA estimator
- Stage: Pre-upload guidance
- Before: No expectation setting.
- After: Estimated time range surfaced before submit.
- High-level implementation: deterministic ETA service.
- Trigger / call hierarchy: `precheck -> eta service -> eta_sec`.
- Stakeholder impact: Better user trust.
- User-visible example: “~2-3 mins” guidance shown.

### Story 6 - Precheck API endpoint
- Stage: API boundary
- Before: UI couldn’t fetch intake guidance.
- After: dedicated `/intake/precheck` endpoint.
- High-level implementation: route+warning+eta orchestration endpoint.
- Trigger / call hierarchy: `UI call -> endpoint -> intake services -> JSON`.
- Stakeholder impact: clear integration point.
- User-visible example: upload panel gets decision payload.

### Story 7 - UI precheck integration
- Stage: UI upload flow
- Before: No pre-submit guidance.
- After: UI calls precheck on file change and displays result.
- High-level implementation: `upload.js` precheck fetch + render.
- Trigger / call hierarchy: `file change/drop -> JS precheck -> UI box update`.
- Stakeholder impact: Better conversion and fewer retries.
- User-visible example: warning panel appears instantly.

### Story 8 - Flag-respecting behavior in UI/API
- Stage: Runtime branching
- Before: UI/API mismatches possible.
- After: both layers honor same feature flag behavior.
- High-level implementation: capability check + endpoint guard.
- Trigger / call hierarchy: `flag check -> route legacy vs smart`.
- Stakeholder impact: predictable rollout.
- User-visible example: precheck hidden when feature disabled.

### Story 9 - Intake observability
- Stage: Telemetry
- Before: no intake-level metrics.
- After: route/warn/eta telemetry with request correlation.
- High-level implementation: structured stage logs + counters.
- Trigger / call hierarchy: `precheck run -> log_stage/incr metrics`.
- Stakeholder impact: ops visibility.
- User-visible example: faster RCA for intake issues.

### Story 10 - Regression checks
- Stage: Validation pipeline
- Before: intake regressions unnoticed.
- After: local/cloud scripts assert intake response and route behavior.
- High-level implementation: regression assertions in scripts.
- Trigger / call hierarchy: `run_regression_* -> precheck assert -> pass/fail`.
- Stakeholder impact: safer releases.
- User-visible example: immediate failure if precheck contract breaks.

### Story 11 - Rollout/rollback docs
- Stage: Release operations
- Before: ad-hoc release steps.
- After: documented phased rollout + rollback.
- High-level implementation: runbook updates.
- Trigger / call hierarchy: `deployment review -> runbook execution`.
- Stakeholder impact: reduced deployment risk.
- User-visible example: faster restore on bad rollout.

### Story 12 - Closure updates
- Stage: Governance/documentation
- Before: completion evidence scattered.
- After: backlog/release/gap docs synchronized.
- High-level implementation: cross-md traceability updates.
- Trigger / call hierarchy: `code+test done -> docs status update`.
- Stakeholder impact: audit-ready tracking.
- User-visible example: clear status in backlog tables.

## Agent #2 - OCR Quality Agent (PRS-036)

### Story 1 - OCR quality contract
- Stage: API status contract
- Before: no OCR quality fields.
- After: `ocr_quality_score`, `low_confidence_pages`, `quality_hints`.
- High-level implementation: schema + contract constants.
- Trigger / call hierarchy: `status/jobs response build -> quality fields included`.
- Stakeholder impact: stable integration for UI/tests.
- User-visible example: quality score in OCR rows.

### Story 2 - Worker OCR quality metadata
- Stage: OCR processing per page
- Before: no persisted page quality.
- After: page metrics summarized into final quality fields.
- High-level implementation: deterministic local scoring + status persistence.
- Trigger / call hierarchy: `run_ocr -> score_page -> summarize -> hset`.
- Stakeholder impact: measurable OCR quality.
- User-visible example: low-confidence pages list.

### Story 3 - UI OCR quality guidance
- Stage: History/completed rendering
- Before: OCR outputs lacked confidence context.
- After: quality badge + hints on OCR items.
- High-level implementation: jobs/completion rendering helpers.
- Trigger / call hierarchy: `jobs payload -> quality model -> badge render`.
- Stakeholder impact: fewer blind downloads.
- User-visible example: amber/red score with hint tooltip.

## Agent #3 - Transcription Quality Agent (PRS-037)

### Story 1 - Transcription quality contract
- Stage: API status contract
- Before: no transcript quality shape.
- After: `transcript_quality_score`, `low_confidence_segments`, `segment_quality`, `transcript_quality_hints`.
- High-level implementation: schema + contract fields.
- Trigger / call hierarchy: `status/jobs response build -> transcription quality fields`.
- Stakeholder impact: consistent integration surface.
- User-visible example: score/hints available in payload.

### Story 2 - Worker transcription quality metadata
- Stage: Chunk/segment transcription
- Before: transcript text only.
- After: deterministic per-segment scoring + summary hints persisted.
- High-level implementation: `transcription_quality.py` + `transcribe.py` integration.
- Trigger / call hierarchy: `transcribe_chunk -> score_segment -> summarize_segments -> final hset`.
- Stakeholder impact: faster noisy-audio diagnosis.
- User-visible example: low-confidence segment indices in status.

### Story 3 - UI transcription quality guidance
- Stage: History/completed rendering
- Before: no quality insight for transcription jobs.
- After: transcription quality badge and guidance shown.
- High-level implementation: jobs/completion quality render logic.
- Trigger / call hierarchy: `jobs/completion payload -> transcription quality model -> badge`.
- Stakeholder impact: better transcript trust decisions.
- User-visible example: warn badge for low transcript quality.

## Agent #4 - Retry & Recovery Agent (PRS-038)

### Story 1 - Recovery decision contract
- Stage: Failure handling
- Before: opaque retries.
- After: recovery decision fields standardized.
- High-level implementation: error/recovery schema additions.
- Trigger / call hierarchy: `job failure -> recovery decision object`.
- Stakeholder impact: explainable retry behavior.
- User-visible example: “retry_with_backoff” visible.

### Story 2 - Policy-based recovery orchestration
- Stage: Worker retry loop
- Before: static retry paths.
- After: policy chooses retry/requeue/fail-fast.
- High-level implementation: classifier + policy action matrix.
- Trigger / call hierarchy: `error_code -> policy evaluator -> action`.
- Stakeholder impact: higher completion rate.
- User-visible example: transient failures auto-recovered.

### Story 3 - Recovery trace in API status
- Stage: Status read
- Before: no visible recovery history.
- After: status includes recovery trace fields.
- High-level implementation: status enrichment from job metadata.
- Trigger / call hierarchy: `worker writes trace -> API /status returns trace`.
- Stakeholder impact: quicker support triage.
- User-visible example: “retry #2 succeeded” trace.

## Agent #5 - Cost Guardrail Agent (PRS-039)

### Story 1 - Cost prediction contract
- Stage: Pre-upload policy
- Before: no stable estimate payload.
- After: estimate/policy fields standardized.
- High-level implementation: response schema updates.
- Trigger / call hierarchy: `precheck/policy -> estimate fields`.
- Stakeholder impact: predictable budgeting.
- User-visible example: cost band shown before upload.

### Story 2 - Policy evaluator service
- Stage: Pre-enqueue decision
- Before: scattered limit checks.
- After: centralized allow/warn/block evaluator.
- High-level implementation: policy service for size/pages/duration/quota.
- Trigger / call hierarchy: `upload/precheck -> policy evaluator -> decision`.
- Stakeholder impact: cleaner policy governance.
- User-visible example: clear block reason.

### Story 3 - UI estimate/policy message
- Stage: Upload UX
- Before: abrupt rejections.
- After: proactive estimate + policy guidance.
- High-level implementation: UI hint panel/toast wiring.
- Trigger / call hierarchy: `policy response -> UI message renderer`.
- Stakeholder impact: lower drop-off.
- User-visible example: warning before expensive run.

## Agent #6 - Queue Orchestration Agent (PRS-040)

### Story 1 - Scheduling contract
- Stage: Worker startup/runtime
- Before: implicit queue behavior.
- After: explicit scheduling config contract.
- High-level implementation: env config + validation.
- Trigger / call hierarchy: `worker startup -> validate scheduler config`.
- Stakeholder impact: tunable throughput.
- User-visible example: reduced wait imbalance.

### Story 2 - Adaptive dequeue
- Stage: Queue consume loop
- Before: one queue could dominate.
- After: adaptive balancing reduces starvation.
- High-level implementation: weighted/fair dequeue policy.
- Trigger / call hierarchy: `queue depths -> scheduler pick -> BRPOP targets`.
- Stakeholder impact: better p95 wait.
- User-visible example: faster mixed OCR/A-V processing.

### Story 3 - Queue-health metrics
- Stage: Ops monitoring
- Before: weak queue observability.
- After: queue health/fairness metrics exposed.
- High-level implementation: worker counters and health snapshots.
- Trigger / call hierarchy: `consume cycle -> metric emit`.
- Stakeholder impact: proactive scaling decisions.
- User-visible example: fewer stuck queued jobs.

### Latest implementation update (2026-02-20)
- Implemented in Worker: requeue backoff + jitter and stale inflight cleanup guard to avoid tight busy loops.
- Implemented in UI: queued timer (`Queued for Xm Ys`), queue-load hint text, and `Fair Scheduler` badge while job is queued.
- Stage: Queue wait experience (processing card while status=`QUEUED`).
- Commits:
  - Worker: `f133018`
  - UI: `e37f91e`
- UI witness:
  - `Queued for 42s`
  - `Queue is busy; fair scheduler is balancing jobs.`
  - Header badge: `Fair Scheduler`

## Agent #7 - User Assist Agent (PRS-041)

### Story 1 - Assist contract
- Stage: Status/error presentation
- Before: no standard assist payload.
- After: structured assist fields for message/action.
- High-level implementation: API/UI contract for assist messages.
- Trigger / call hierarchy: `status mapping -> assist payload`.
- Stakeholder impact: reusable help patterns.
- User-visible example: specific next-step card.

### Story 2 - Status/error to assist mapping
- Stage: API/worker-to-UI bridge
- Before: generic support text.
- After: contextual hints by failure/status.
- High-level implementation: mapping table/service.
- Trigger / call hierarchy: `error_code/status -> assist resolver`.
- Stakeholder impact: fewer support tickets.
- User-visible example: “invalid token” -> guided refresh steps.

### Story 3 - Assist panel UI
- Stage: Frontend guidance
- Before: hints buried in toasts/logs.
- After: dedicated assist panel in relevant states.
- High-level implementation: UI component + rendering conditions.
- Trigger / call hierarchy: `status update -> assist panel render`.
- Stakeholder impact: better completion journey.
- User-visible example: inline recover action CTA.

## Agent #8 - Incident Triage Agent (PRS-042)

### Story 1 - Triage report schema
- Stage: Incident reporting
- Before: inconsistent triage outputs.
- After: stable schema for cause/evidence/actions.
- High-level implementation: triage report contract.
- Trigger / call hierarchy: `incident context -> triage schema output`.
- Stakeholder impact: standardized incident handoff.
- User-visible example: machine-readable triage summary.

### Story 2 - Correlation collector
- Stage: RCA pipeline
- Before: manual cross-log correlation.
- After: auto-correlation by request/job IDs.
- High-level implementation: collector over UI/API/Worker logs.
- Trigger / call hierarchy: `incident id -> fetch logs -> correlate`.
- Stakeholder impact: lower MTTR.
- User-visible example: one linked event timeline.

### Story 3 - Runbook suggestions
- Stage: Incident response
- Before: remediation depended on engineer memory.
- After: suggested runbook actions attached to triage.
- High-level implementation: rule-based runbook mapper.
- Trigger / call hierarchy: `triage root cause -> runbook suggestion`.
- Stakeholder impact: faster consistent recovery.
- User-visible example: “Redis auth failure -> check env/connection policy”.

## Agent #9 - Regression Certification Agent (PRS-043)

### Story 1 - Certification output contract
- Stage: Release decisioning
- Before: inconsistent release summary format.
- After: stable go/no-go certification schema.
- High-level implementation: certification report contract.
- Trigger / call hierarchy: `collect checks -> compose certification payload`.
- Stakeholder impact: auditable release quality gate.
- User-visible example: explicit `GO`/`NO_GO` with reasons.

### Story 2 - Evidence aggregation
- Stage: Pre-release checks
- Before: evidence scattered.
- After: CI/local/cloud evidence aggregated centrally.
- High-level implementation: aggregator script/service.
- Trigger / call hierarchy: `fetch CI + regression outputs -> aggregate`.
- Stakeholder impact: quicker release readiness review.
- User-visible example: one summary artifact for decision.

### Story 3 - Release gate
- Stage: Deployment gate
- Before: manual/noisy gate decisions.
- After: required failures block release automatically.
- High-level implementation: gate policy on certification output.
- Trigger / call hierarchy: `certification result -> gate allow/block`.
- Stakeholder impact: fewer bad releases.
- User-visible example: deployment blocked with actionable reasons.

## Agent #10 - Product Insights Agent (PRS-044)

### Story 1 - Product metric contract
- Stage: Product telemetry
- Before: ad-hoc KPIs.
- After: stable metric schema across dimensions.
- High-level implementation: analytics contract.
- Trigger / call hierarchy: `jobs/events -> KPI payload normalization`.
- Stakeholder impact: comparable trend analysis.
- User-visible example: consistent completion/drop-off metrics.

### Story 2 - Analytics aggregation endpoint
- Stage: Insights backend
- Before: no single insights API.
- After: endpoint serves windowed/type-wise metrics.
- High-level implementation: aggregation API/service.
- Trigger / call hierarchy: `insights request -> aggregate -> response`.
- Stakeholder impact: PM/dev evidence-based planning.
- User-visible example: top failure clusters by period.

### Story 3 - Insight summary for prioritization
- Stage: Planning workflow
- Before: anecdotal prioritization.
- After: data-backed recommendation summary.
- High-level implementation: summary generator/ranking rules.
- Trigger / call hierarchy: `aggregated metrics -> priority recommendations`.
- Stakeholder impact: better roadmap ROI.
- User-visible example: recommended backlog IDs with rationale.
