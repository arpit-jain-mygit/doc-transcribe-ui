# Agentic AI Story Before/After (User-Centric)

This file captures before/after impact for **every story** across Agent #1 to Agent #10.
For each story:
- Before: what user/stakeholder pain existed
- After: what changes after implementation
- User-centric example: payload/UI/ops artifact that makes the improvement visible

## Agent #1 - Smart Intake Agent (PRS-035)

### Story 1 - Add intake contract (data shape only)
- Before:
  - No pre-upload contract for route/warnings/ETA.
  - UI/API could drift on field names.
- After:
  - Stable intake response contract exists (`detected_job_type`, `warnings`, `eta_sec`, `confidence`, `reasons`).
- User-centric example:
```json
{
  "detected_job_type": "OCR",
  "warnings": [],
  "eta_sec": 60,
  "confidence": 0.92,
  "reasons": ["mime=application/pdf"]
}
```

### Story 2 - Feature flag wiring
- Before:
  - Intake behavior could not be safely toggled by environment.
- After:
  - `FEATURE_SMART_INTAKE` controls rollout and rollback safely.
- User-centric example:
```json
{"feature":"FEATURE_SMART_INTAKE","state":"off","user_behavior":"legacy_upload_flow"}
```

### Story 3 - Deterministic route detector
- Before:
  - Route assumptions were implicit, not explicitly explained.
- After:
  - Rule-based routing gives predictable `OCR` vs `TRANSCRIPTION` decision with reasons.
- User-centric example:
```json
{"filename":"sample.mp3","mime_type":"audio/mpeg","detected_job_type":"TRANSCRIPTION","reasons":["mime=audio/*"]}
```

### Story 4 - Precheck warning service
- Before:
  - User saw problems only after upload started.
- After:
  - User gets warnings before upload (large file/page count/duration quality hints).
- User-centric example:
```json
{"warnings":[{"code":"LARGE_FILE","severity":"WARN","message":"Large file may take longer."}]}
```

### Story 5 - ETA estimator
- Before:
  - User had no pre-upload timing expectation.
- After:
  - Pre-upload ETA shown using deterministic rules.
- User-centric example:
```json
{"eta_sec":120,"note":"estimate only"}
```

### Story 6 - Precheck API endpoint
- Before:
  - No endpoint to get intake decision before upload.
- After:
  - `/intake/precheck` returns route/warnings/ETA/confidence.
- User-centric example:
```json
{"path":"/intake/precheck","status":200,"response":{"detected_job_type":"OCR","eta_sec":75}}
```

### Story 7 - UI precheck call
- Before:
  - File selection had no intelligent preview.
- After:
  - On file select, UI fetches guidance and shows user-friendly hints.
- User-centric example:
```json
{"ui_event":"file_selected","api_call":"/intake/precheck","ui_hint":"Estimated time ~1-2 minutes"}
```

### Story 8 - Flag respect in UI/API
- Before:
  - Possible mismatch where UI/API behavior differed under rollout.
- After:
  - Both UI and API honor same flag state.
- User-centric example:
```json
{"flag":"FEATURE_SMART_INTAKE=0","ui_precheck":"skipped","api_precheck":"404 FEATURE_DISABLED"}
```

### Story 9 - Intake observability
- Before:
  - No measurable intake decision telemetry.
- After:
  - Logs + metrics capture route, warning count, ETA bucket, request correlation.
- User-centric example:
```json
{"stage":"INTAKE_PRECHECK_DECISION","request_id":"req-...","route":"OCR","warning_count":1,"eta_bucket":"31_120s"}
```

### Story 10 - Regression checks for precheck
- Before:
  - Regressions could silently break precheck route/payload.
- After:
  - Local/cloud regression scripts assert intake fields and expected route.
- User-centric example:
```json
{"regression_step":"intake_precheck_assert","expected_route":"TRANSCRIPTION","result":"PASS"}
```

### Story 11 - Rollout/rollback docs
- Before:
  - Ops lacked clear rollout sequence for Smart Intake.
- After:
  - Documented shadow -> visible -> full rollout with rollback path.
- User-centric example:
```json
{"runbook":"smart_intake","phase":"visible","rollback":"set FEATURE_SMART_INTAKE=0"}
```

### Story 12 - Backlog closure updates
- Before:
  - Completion evidence scattered.
- After:
  - Status, test evidence, and traceability updated in backlog/gap/release docs.
- User-centric example:
```json
{"backlog_id":"PRS-035","status":"Completed (Tested)","evidence":"local+cloud regression"}
```

## Agent #2 - OCR Quality Agent (PRS-036)

### Story 1 - Define OCR quality contract
- Before: OCR completion lacked structured quality signal.
- After: Contract adds `ocr_quality_score`, `low_confidence_pages`, `quality_hints`.
- User-centric example:
```json
{"ocr_quality_score":0.78,"low_confidence_pages":[2,5],"quality_hints":["Page 2 low contrast"]}
```

### Story 2 - Emit OCR quality metadata from worker
- Before: Worker did not persist page-level quality metadata.
- After: Worker computes and writes quality fields into status payload.
- User-centric example:
```json
{"job_id":"...","status":"PROCESSING","quality":{"page":3,"confidence":0.62}}
```

### Story 3 - Show OCR quality guidance in UI
- Before: User saw completed output without quality context.
- After: UI shows quality badge/warning and suggested next action.
- User-centric example:
```json
{"ui_badge":"Low OCR confidence","action":"Retry with clearer scan"}
```

## Agent #3 - Transcription Quality Agent (PRS-037)

### Story 1 - Define transcript quality contract
- Before: No stable segment-quality fields.
- After: Contract adds segment confidence/noise/speaker quality fields.
- User-centric example:
```json
{"segment_quality":[{"start_sec":0,"end_sec":18,"confidence":0.71,"noise":"high"}]}
```

### Story 2 - Emit quality metadata from transcription pipeline
- Before: Pipeline emitted transcript text only.
- After: Pipeline stores per-segment quality metadata.
- User-centric example:
```json
{"chunk":1,"avg_confidence":0.76,"noise_detected":true}
```

### Story 3 - Render transcript hints in UI
- Before: User had no clue which portion was weak.
- After: UI highlights weak segments and shows corrective tips.
- User-centric example:
```json
{"hint":"0:42-1:05 has low confidence. Use cleaner audio or retry."}
```

## Agent #4 - Retry & Recovery Agent (PRS-038)

### Story 1 - Define recovery decision contract
- Before: Retry decisions were not visible as a model.
- After: Contract includes selected recovery action and reason.
- User-centric example:
```json
{"recovery_action":"retry_with_backoff","reason":"TRANSIENT_NETWORK"}
```

### Story 2 - Policy-based recovery orchestration
- Before: Recovery behavior was static and brittle.
- After: Policy selects retry/requeue/fail-fast based on error class.
- User-centric example:
```json
{"error_code":"INFRA_GCS","policy":"transient","attempt":2,"max":4}
```

### Story 3 - Expose recovery trace in API status
- Before: User/ops could not see what recovery happened.
- After: Status includes recovery trace for diagnostics.
- User-centric example:
```json
{"status":"PROCESSING","recovery_trace":["retry#1","retry#2"]}
```

## Agent #5 - Cost Guardrail Agent (PRS-039)

### Story 1 - Add cost prediction contract
- Before: No predictable shape for cost/effort estimate.
- After: Contract defines estimate fields and policy outcome.
- User-centric example:
```json
{"estimated_effort":"medium","estimated_cost_band":"low","policy_outcome":"allow"}
```

### Story 2 - Implement policy evaluator service
- Before: Policy checks were scattered and hard to reason.
- After: Central evaluator returns deterministic allow/warn/block outcome.
- User-centric example:
```json
{"policy":"quota_check","outcome":"warn","reason":"near_daily_limit"}
```

### Story 3 - Show estimate/policy message in UI
- Before: Users hit hard rejections without context.
- After: UI shows pre-upload estimate + policy messaging.
- User-centric example:
```json
{"toast":"This file may take longer and count against your daily quota."}
```

## Agent #6 - Queue Orchestration Agent (PRS-040)

### Story 1 - Add scheduling policy contract
- Before: Queue strategy lacked explicit config contract.
- After: Stable policy fields for fairness/priority/tuning.
- User-centric example:
```json
{"queue_policy":"fair_share","ocr_weight":1,"av_weight":1}
```

### Story 2 - Implement adaptive dequeue
- Before: Single static dequeue could starve one workload.
- After: Adaptive dequeue balances mixed OCR/A-V load.
- User-centric example:
```json
{"scheduler":"adaptive","picked_queue":"doc_jobs_ocr","reason":"av_backlog_low"}
```

### Story 3 - Expose queue-health metrics
- Before: Ops had weak visibility into queue bottlenecks.
- After: Queue depth/wait/fairness metrics exposed.
- User-centric example:
```json
{"metric":"queue_wait_p95_sec","ocr":42,"transcription":55}
```

### Latest UI-visible update (2026-02-20)
- Before: user only saw generic `Queued` with no queue context.
- After: user sees live queue wait and scheduler context on processing card.
- User-centric example:
```json
{
  "status": "QUEUED",
  "queue_timer": "Queued for 1m 12s",
  "queue_hint": "High queue load; fair scheduler active to prevent starvation.",
  "scheduler_badge": "Fair Scheduler"
}
```

## Agent #7 - User Assist Agent (PRS-041)

### Story 1 - Define assist-message contract
- Before: No standard shape for actionable UI help.
- After: Contract defines assist type/message/action links.
- User-centric example:
```json
{"assist_type":"retry_tip","message":"Try clearer scan","action_label":"Re-upload"}
```

### Story 2 - Map status/error to assist actions
- Before: Same generic message shown for many failure types.
- After: Context-specific assist messages based on status/error.
- User-centric example:
```json
{"error_code":"UNSUPPORTED_MIME_TYPE","assist":"Upload mp3/wav/mp4 only"}
```

### Story 3 - Render assist panel in UI
- Before: Guidance buried in logs/toasts.
- After: Dedicated assist panel appears during wait/failure states.
- User-centric example:
```json
{"panel":"assist","state":"FAILED","suggestions":["Check file type","Retry"]}
```

## Agent #8 - Incident Triage Agent (PRS-042)

### Story 1 - Define triage report schema
- Before: Incident triage output had no stable shape.
- After: Report schema for suspected cause, evidence, next steps.
- User-centric example:
```json
{"incident_id":"inc-...","probable_cause":"Redis auth","confidence":0.84}
```

### Story 2 - Build correlation collector across logs
- Before: Cross-layer debugging was manual and slow.
- After: Collector links UI/API/Worker events by request/job IDs.
- User-centric example:
```json
{"request_id":"req-...","api_event_count":12,"worker_event_count":9}
```

### Story 3 - Generate runbook suggestions
- Before: Ops had to infer remediation from raw logs.
- After: Triage output includes targeted runbook actions.
- User-centric example:
```json
{"next_actions":["Check REDIS_URL","Run worker readiness","Inspect queue depth"]}
```

## Agent #9 - Regression Certification Agent (PRS-043)

### Story 1 - Define certification output contract
- Before: Release readiness summary was inconsistent.
- After: Contract defines go/no-go output with gate evidence.
- User-centric example:
```json
{"certification":"NO_GO","failed_gates":["cloud_regression"]}
```

### Story 2 - Aggregate CI/local/cloud evidence
- Before: Evidence spread across multiple tools/files.
- After: Single machine-readable certification artifact.
- User-centric example:
```json
{"ci":"PASS","local_regression":"PASS","cloud_regression":"PASS","verdict":"GO"}
```

### Story 3 - Gate release decision
- Before: Releases could proceed despite critical failures.
- After: Fail-fast gate blocks release when required checks fail.
- User-centric example:
```json
{"gate":"release","required_checks":["ci","local","cloud"],"result":"BLOCKED"}
```

## Agent #10 - Product Insights Agent (PRS-044)

### Story 1 - Define product metric contract
- Before: Product KPI fields were ad-hoc.
- After: Stable KPI contract for adoption/completion/drop-off/turnaround.
- User-centric example:
```json
{"adoption_rate":0.63,"completion_rate":0.91,"dropoff_rate":0.09,"median_turnaround_sec":84}
```

### Story 2 - Build analytics aggregation endpoint
- Before: No dedicated endpoint for product-level insight aggregation.
- After: Endpoint returns metrics by window/type.
- User-centric example:
```json
{"window":"7d","by_job_type":{"OCR":{"count":120},"TRANSCRIPTION":{"count":95}}}
```

### Story 3 - Surface insights for prioritization
- Before: Backlog prioritization depended on anecdotal signals.
- After: Insight summaries drive roadmap priorities with evidence.
- User-centric example:
```json
{"top_pain_points":["A/V long-wait dropoff","Low-quality scans"],"recommended_backlog_ids":["PRS-040","PRS-036"]}
```
