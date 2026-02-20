# Agentic AI Backlog

This document is the dedicated implementation guide for agent backlog items:
- `PRS-035` to `PRS-044`

It is written for beginners. It explains:
1. What each agent does.
2. Who benefits (Users / Dev / Ops / Product).
3. How to implement the first agent (`PRS-035`) in tiny stories (file-by-file, no full code dump).

Companion references:
- Story-level before/after + user-centric examples for all agents:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/AGENTIC_AI_STORY_BEFORE_AFTER.md`
- Story-level full details (stage, before/after, implementation, trigger/call hierarchy, stakeholder impact, example) for all agents:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/AGENTIC_AI_STORY_DETAILS.md`

Mandatory story documentation standard (for all future updates):
- Every new/updated story must include:
  1. Before (what pain existed)
  2. After (what improves)
  3. User-centric example (JSON payload/UI artifact/ops signal)

## 1) Agent Catalog (What + Who benefits)

| Agent # | PRS Ref | Agent | What it does | Users | Dev | Ops | Product | Stories |
|---|---|---|---|---|---|---|---|---|
| 1 | PRS-035 | Smart Intake Agent | Auto-route + prechecks + ETA before enqueue | Fewer bad uploads | Fewer edge-case bugs | Less avoidable failure load | Better upload conversion | [Story 1: Intake contract](#agent-1-story-1)<br>[Story 2: Feature flag wiring](#agent-1-story-2)<br>[Story 3: Route detector](#agent-1-story-3)<br>[Story 4: Precheck warnings](#agent-1-story-4)<br>[Story 5: ETA estimator](#agent-1-story-5)<br>[Story 6: Precheck API endpoint](#agent-1-story-6)<br>[Story 7: UI precheck call](#agent-1-story-7)<br>[Story 8: Flag respect in UI/API](#agent-1-story-8)<br>[Story 9: Observability](#agent-1-story-9)<br>[Story 10: Regression checks](#agent-1-story-10)<br>[Story 11: Rollout/rollback docs](#agent-1-story-11)<br>[Story 12: Backlog closure](#agent-1-story-12) |
| 2 | PRS-036 | OCR Quality Agent | OCR confidence + low-quality page hints | Better OCR quality | Better quality signals | Earlier quality issue detection | Quality KPI tracking | [Story 1: OCR quality contract](#agent-2-story-1)<br>[Story 2: Worker quality metadata](#agent-2-story-2)<br>[Story 3: UI quality guidance](#agent-2-story-3) |
| 3 | PRS-037 | Transcription Quality Agent | Segment confidence + noise/speaker hints | Better transcripts | Better diagnostics | Faster noisy-audio triage | Trust improvements | [Story 1: Transcript-quality contract](#agent-3-story-1)<br>[Story 2: Transcription quality metadata](#agent-3-story-2)<br>[Story 3: UI transcript hints](#agent-3-story-3) |
| 4 | PRS-038 | Retry & Recovery Agent | Policy-based recovery actions | Higher completion | Cleaner recovery logic | Lower manual retries | Stability gains | [Story 1: Recovery contract](#agent-4-story-1)<br>[Story 2: Recovery orchestration](#agent-4-story-2)<br>[Story 3: API recovery trace](#agent-4-story-3) |
| 5 | PRS-039 | Cost Guardrail Agent | Cost/limit prediction + enforcement | Clear limits | Safer controls | Cost/load control | Better unit economics | [Story 1: Cost contract](#agent-5-story-1)<br>[Story 2: Policy evaluator](#agent-5-story-2)<br>[Story 3: UI estimate message](#agent-5-story-3) |
| 6 | PRS-040 | Queue Orchestration Agent | Dynamic balancing and prioritization | Lower waits | Better scheduler logic | Less contention | Better peak UX | [Story 1: Scheduling config](#agent-6-story-1)<br>[Story 2: Adaptive dequeue](#agent-6-story-2)<br>[Story 3: Queue-health metrics](#agent-6-story-3) |
| 7 | PRS-041 | User Assist Agent | Next-best-action guidance in UI | Clearer journey | Reusable guidance patterns | Fewer support tickets | Lower drop-off | [Story 1: Assist contract](#agent-7-story-1)<br>[Story 2: Status-to-assist mapping](#agent-7-story-2)<br>[Story 3: UI assist panel](#agent-7-story-3) |
| 8 | PRS-042 | Incident Triage Agent | Cross-layer root-cause helper | Faster resolution | Faster debugging | Lower MTTR | Reliability confidence | [Story 1: Triage report schema](#agent-8-story-1)<br>[Story 2: Correlation collector](#agent-8-story-2)<br>[Story 3: Runbook suggestions](#agent-8-story-3) |
| 9 | PRS-043 | Regression Certification Agent | Auto certify release readiness | Fewer regressions | Faster release checks | Predictable deploy quality | Safer release cadence | [Story 1: Certification contract](#agent-9-story-1)<br>[Story 2: Evidence aggregation](#agent-9-story-2)<br>[Story 3: Release gate](#agent-9-story-3) |
| 10 | PRS-044 | Product Insights Agent | Usage/failure trend analysis | Better UX over time | Data-backed prioritization | Trend visibility | Better roadmap decisions | [Story 1: Product metric contract](#agent-10-story-1)<br>[Story 2: Analytics aggregation endpoint](#agent-10-story-2)<br>[Story 3: Insight summary output](#agent-10-story-3) |

---

<a id="agent-1-stories"></a>
## 2) PRS-035 Smart Intake Agent (Tiny Stories)

Important:
- Start with deterministic rules (no LangChain/LangGraph needed).
- Keep each story small and independently testable.
- Do not change user behavior abruptly: use feature flags.

<a id="agent-1-story-1"></a>
### Story 1: Add intake contract (data shape only)

**Stage**
- Contract and schema foundation (pre-upload)

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Define what Smart Intake returns.

**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/requests.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/job-contract.js` (if UI contract mapping is needed)

**Change**
- Add request/response schema for intake precheck:
  - `detected_job_type`
  - `warnings[]`
  - `eta_sec` (or `eta_range`)
  - `confidence`
  - `reasons[]`

**Test**
- Unit test schema serialization and required/optional fields.

**Story 1 testcases (run now)**
1. API unit tests
- Command:
  - `cd /Users/arpitjain/PycharmProjects/doc-transcribe-api && .venv/bin/python -m unittest discover -s tests -p "test_*_unit.py"`
- Expected:
  - `test_intake_contract_unit.py` executes and passes.

2. API schema sanity check
- Command:
  - `cd /Users/arpitjain/PycharmProjects/doc-transcribe-api && .venv/bin/python - <<'PY'`
  - `from schemas.requests import IntakePrecheckRequest`
  - `from schemas.responses import IntakePrecheckResponse`
  - `r = IntakePrecheckRequest(filename="sample.pdf")`
  - `o = IntakePrecheckResponse(detected_job_type="OCR")`
  - `print(r.filename, o.detected_job_type, o.warnings, o.reasons, o.confidence)`
  - `PY`
- Expected:
  - Output includes: `sample.pdf OCR [] [] 0.0`

3. UI unit regression
- Command:
  - `cd /Users/arpitjain/VSProjects/doc-transcribe-ui && npm test`
- Expected:
  - Existing UI tests pass with no regression.

4. Optional browser-console mapping check
- Command (browser console):
  - `window.JOB_CONTRACT.resolveIntakePrecheck({ detected_job_type: "TRANSCRIPTION", warnings: [{ code: "LARGE_FILE", message: "Large file", severity: "WARN" }], eta_sec: 120, confidence: 0.85, reasons: ["mime=audio/mpeg"] })`
- Expected:
  - Returns object with keys: `detectedJobType`, `warnings`, `etaSec`, `confidence`, `reasons`.

5. Not expected in Story 1
- No intake precheck API endpoint yet.
- No pre-upload UI panel yet.

**Implementation evidence (Story 1)**
- Status: `Completed (Code)` and unit tests passing.
- Changes summary:
  - Added intake request/response schema models and contract fields.
  - Added UI contract resolver placeholder for intake payload mapping.
  - Added unit tests for schema validity and invalid cases.
- Call hierarchy:
  - Trigger event: API import/startup and request validation lifecycle loads `schemas/requests.py` and `schemas/responses.py`.
  - Trigger event: Any endpoint returning/validating intake payload uses the schema contract.
  - Trigger event: UI script load attaches `window.JOB_CONTRACT.resolveIntakePrecheck(...)`.
- Commits:
  - API: `952d12b` (`PRS-035 Story1: add intake precheck schemas, contract fields, and unit tests`)
  - UI: `f444f9d` (`PRS-035 Story1: add intake precheck contract resolver placeholder in UI`)
- Files changed:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/requests.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/job_contract.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/tests/test_intake_contract_unit.py`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/job-contract.js`

---

<a id="agent-1-story-2"></a>
### Story 2: Add feature flag wiring (off by default)

**Stage**
- Rollout control foundation (pre-upload)

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Deploy safely with zero behavior change.

**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/feature_flags.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/startup_env.py`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/config.js`

**Change**
- Add `FEATURE_SMART_INTAKE=0|1`.
- Startup validation for flag value.
- UI reads flag/capability.

**Test**
- API starts with flag on/off.
- Existing upload flow unchanged when off.

**Implementation evidence (Story 2)**
- Status: `Completed (Code)` with zero behavior change by default.
- Scope:
  - API: `FEATURE_SMART_INTAKE` flag wiring, startup env validation, and contract capability exposure.
  - UI: smart-intake capability wiring with safe default `false`.
  - Docs: API/UI feature-flag docs updated for rollout/rollback.
- Changes summary:
  - Added API flag constant/helper and startup validation for allowed values.
  - Exposed capability on `/contract/job-status`.
  - Added UI helper methods to set/read smart-intake capability.
  - Added +ive/−ive unit tests for API/UI flag behavior.
- Call hierarchy:
  - Trigger event: API startup -> `validate_startup_env()` -> `_validate_bool_flag_env("FEATURE_SMART_INTAKE", ...)`.
  - `GET /contract/job-status` -> `routes/contract.py:job_status_contract()` -> `is_smart_intake_enabled()`.
  - Trigger event: UI script load (`js/config.js`) initializes `window.FEATURE_SMART_INTAKE=false`.
  - Future/consumer call path: `window.setSmartIntakeCapability(...)` -> `window.isSmartIntakeEnabled()`.
- Commits/files will be added after local + cloud regression pass.

---

<a id="agent-1-story-3"></a>
### Story 3: Build deterministic route detector service

**Stage**
- Pre-upload route decision

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Decide OCR vs TRANSCRIPTION from file metadata.

**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/intake_router.py` (new)
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/upload_orchestrator.py`

**Change**
- Add pure function: input (`filename`, `mime`) -> route + reason.
- Keep strict fallback behavior for unknown types.

**Test**
- Unit test with pdf/png/jpg/mp3/mp4/ambiguous extensions.

**Implementation evidence (Story 3)**
- Status: `Completed (Code)` with deterministic route service and strict unknown fallback.
- Scope:
  - API: new pure route detector service (`filename` + `mime` -> `detected_job_type` + `confidence` + `reasons`).
  - API: upload orchestration now logs route-detection result (`UPLOAD_ROUTE_DETECT`) for observability.
  - Tests: added positive + negative unit tests for OCR/transcription/mismatch/unknown paths.
- Changes summary:
  - Added pure metadata route detector service.
  - Reused centralized extension/MIME constants in upload orchestrator.
  - Added route-detection stage logging before upload validation.
- Call hierarchy:
  - `POST /upload` -> `routes/upload.py:upload()` -> `submit_upload_job(...)`.
  - `submit_upload_job(...)` -> `detect_route_from_metadata(file.filename, file.content_type)`.
  - `detect_route_from_metadata(...)` -> `_route_from_extension(...)` and `_route_from_mime(...)`.
  - `submit_upload_job(...)` -> `log_stage(stage="UPLOAD_ROUTE_DETECT", ...)`.
- Commits/files will be added after local + cloud regression pass.

---

<a id="agent-1-story-4"></a>
### Story 4: Build precheck warning service

**Stage**
- Pre-upload risk guidance

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Return soft warnings before processing.

**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/intake_precheck.py` (new)
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/quota.py` (read-only reuse or light extension)

**Change**
- Produce warnings (not rejects) for:
  - large file size
  - long media duration
  - high page count
  - uncertain MIME/extension match

**Test**
- Unit tests for warning thresholds and warning text determinism.

**Implementation evidence (Story 4)**
- Status: `Completed (Code)` with deterministic warning generation and no user-flow break.
- Scope:
  - API: added `intake_precheck` warning service for large file, long media, high page count, and metadata uncertainty.
  - API: upload orchestration emits `UPLOAD_PRECHECK_WARNINGS` stage logs when warnings are detected.
  - Tests: added positive + negative unit tests for warning presence/absence and uncertain metadata.
- Changes summary:
  - Added precheck warning builder service with deterministic thresholds/rules.
  - Added warning detection path in upload orchestration (log-only, no rejection behavior).
  - Added +ive/−ive unit tests for each warning type and clean/no-warning path.
- Call hierarchy:
  - `POST /upload` -> `routes/upload.py:upload()` -> `submit_upload_job(...)`.
  - `submit_upload_job(...)` -> `build_precheck_warnings(...)`.
  - `build_precheck_warnings(...)` -> `_size_warnings(...)`, `_duration_warnings(...)`, `_page_warnings(...)`, `_metadata_warnings(...)`.
  - `_metadata_warnings(...)` -> `detect_route_from_metadata(...)` (Story 3 service reuse).
  - Event trigger: if warnings exist, `submit_upload_job(...)` emits `log_stage(stage="UPLOAD_PRECHECK_WARNINGS", ...)`.
- Commits/files will be added after local + cloud regression pass.

---

<a id="agent-1-story-5"></a>
### Story 5: Add simple ETA estimator service

**Stage**
- Pre-upload expectation setting

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Give rough expected completion time.

**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/intake_eta.py` (new)
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/jobs.py` (if historical query helper needed)

**Change**
- Start with bucketed static + historical median fallback.
- Return conservative estimate/range.

**Test**
- Unit tests for ETA output with/without historical data.

**Implementation evidence (Story 5)**
- Status: `Planned`
- Changes summary:
  - Add deterministic ETA estimator service with conservative buckets.
  - Support optional historical fallback (median by type/size band) without blocking request.
  - Return stable `eta_sec` or bounded range for pre-upload guidance.
- Call hierarchy:
  - Planned API flow: `POST /intake/precheck` -> `routes/intake.py:precheck()` -> `estimate_eta(...)`.
  - `estimate_eta(...)` -> static rule path (always available).
  - Event trigger: if historical data source is enabled/available, estimator also reads historical median.
  - Output path: estimator result merged into intake response payload.

---

<a id="agent-1-story-6"></a>
### Story 6: Add intake precheck API endpoint

**Stage**
- Pre-upload API exposure

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Expose agent decision before upload submit.

**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/intake.py` (new)
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/app.py`

**Change**
- Add `POST /intake/precheck`.
- Return route + warnings + eta + confidence + reasons.

**Test**
- API integration test for sample inputs and response shape.

**Implementation evidence (Story 6)**
- Status: `Completed (Code)`
- Changes summary:
  - Added `/intake/precheck` endpoint for pre-upload decisioning.
  - Endpoint now orchestrates route detection + warning generation + ETA in one response.
  - Endpoint remains side-effect free (no queue push, no job creation).
- Call hierarchy:
  - `POST /intake/precheck` -> `routes/intake.py:precheck()`.
  - `precheck()` -> `detect_route_from_metadata(...)` (Story 3).
  - `precheck()` -> `build_precheck_warnings(...)` (Story 4).
  - `precheck()` -> `estimate_eta(...)` (Story 5).
  - `precheck()` -> response mapping to `IntakePrecheckResponse`.

---

<a id="agent-1-story-7"></a>
### Story 7: UI precheck call on file selection

**Stage**
- UI pre-upload interaction

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Show decision before enqueue.

**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/api-client.js`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/upload.js`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/partials/upload-grid.html`

**Change**
- Call precheck after file select/drop.
- Render route, warnings, ETA in a compact area.

**Test**
- Manual UI test with `sample.pdf` and `sample.mp3`.

**Implementation evidence (Story 7)**
- Status: `Completed (Code)`
- Changes summary:
  - Added API client method for intake precheck call.
  - Triggered precheck on file select/drop before upload submit.
  - Added compact route/warnings/ETA preview in upload area.
- Call hierarchy:
  - Trigger event: file selected or dropped in UI.
  - Event handler in `js/upload.js` -> `js/api-client.js:precheckIntake(...)`.
  - UI render path: precheck response -> upload preview component in `partials/upload-grid.html`.
  - Event trigger: preview refreshes each time user changes selected file.

---

<a id="agent-1-story-8"></a>
### Story 8: Respect feature flag in UI/API

**Stage**
- Controlled pre-upload rollout

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Keep old behavior when disabled.

**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/config.js`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/intake.py`

**Change**
- If flag off: hide precheck UI and skip endpoint usage.

**Test**
- Compare behavior with `FEATURE_SMART_INTAKE=0` vs `1`.

**Implementation evidence (Story 8)**
- Status: `Completed (Code)`
- Changes summary:
  - Enforced strict flag behavior in API endpoint and UI invocation.
  - With flag OFF, legacy upload flow remains unchanged.
  - With flag ON, precheck call + preview are enabled.
- Call hierarchy:
  - Trigger event: UI startup/capability fetch sets smart intake capability.
  - UI path: `isSmartIntakeEnabled()` gate -> call or skip `precheckIntake(...)`.
  - API path: intake route checks `is_smart_intake_enabled()` and returns gated response if disabled.
  - Event trigger: runtime flag toggle in environment changes behavior after redeploy/restart.

---

<a id="agent-1-story-9"></a>
### Story 9: Add observability for intake decisions

**Stage**
- Pre-upload observability

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Make decisions auditable.

**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/utils/stage_logging.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/utils/metrics.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/intake.py`

**Change**
- Log with `request_id`, route, confidence, warning_count.
- Metrics: decision count by route, warning count, ETA bucket.

**Test**
- Verify logs/metrics fields exist and are consistent.

**Implementation evidence (Story 9)**
- Status: `Completed (Code + Tested)`
- Changes summary:
  - Added stage logs for intake decisions with `request_id`, route, confidence, warning_count, and ETA bucket.
  - Added metrics for route distribution, warning rates, and ETA buckets in precheck endpoint.
  - Kept telemetry deterministic and safe (no token/PII leakage).
- Call hierarchy:
  - `POST /intake/precheck` -> decision computation (Stories 3/4/5).
  - Decision output -> `log_stage(stage="INTAKE_PRECHECK_DECISION", ...)`.
  - Decision output -> `incr(...)` metric updates.
  - Event trigger: each precheck request emits one telemetry record set.

---

<a id="agent-1-story-10"></a>
### Story 10: Add regression checks for precheck

**Stage**
- Pre-upload quality gate

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Prevent regressions in intake behavior.

**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/FUNCTIONAL_REGRESSION_TESTS.md`

**Change**
- Add optional precheck assertions before upload step.
- Keep bounded timeout and clear diagnostics.

**Test**
- Local + cloud regression pass with Smart Intake on/off.

**Implementation evidence (Story 10)**
- Status: `Completed (Code + Tested)`
- Changes summary:
  - Extended local/cloud regression scripts with optional precheck assertions before upload.
  - Validated both flag modes: disabled (precheck skip) and enabled (precheck payload + route assertions).
  - Kept bounded timeouts and concise failure diagnostics.
- Call hierarchy:
  - Regression runner start -> precheck step (conditional by test mode).
  - Precheck assertion step -> upload step -> status polling (existing flow).
  - Event trigger: `SMART_INTAKE_TEST_MODE=on|off` (or equivalent) controls assertion branch.

---

<a id="agent-1-story-11"></a>
### Story 11: Document rollout and rollback

**Stage**
- Operational rollout

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Safe production adoption.

**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/RUNBOOKS.md`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/FEATURE_FLAGS.md`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/RELEASE_NOTES.md`

**Change**
- Add rollout steps:
  - shadow mode
  - visible warnings mode
  - full mode
- Add rollback procedure via feature flag.

**Test**
- Dry-run toggle procedure in staging/local.

**Implementation evidence (Story 11)**
- Status: `Completed (Code + Tested)`
- Changes summary:
  - Documented phased rollout (shadow/visible/full) and rollback runbook for Smart Intake.
  - Defined operator checklist, guardrails, and expected telemetry per phase.
  - Added release-note entry for Smart Intake rollout and verification.
- Call hierarchy:
  - Trigger event: deployment planning/release review references runbook.
  - Operator action path: set flag -> deploy/restart -> verify health/contract/metrics -> proceed or rollback.
  - Event trigger: incident or metric regression invokes rollback procedure.

---

<a id="agent-1-story-12"></a>
### Story 12: Backlog and closure updates

**Stage**
- Governance and closure

**Agent used**
- Smart Intake Agent (PRS-035)

**Goal**
- Maintain traceability.

**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/PRODUCTION_READINESS_BACKLOG.md`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/CURRENT_STATE_AND_GAP_ANALYSIS.md`

**Change**
- Update PRS-035 status: `Completed (Code)` then `Completed (Tested)` only after local+cloud pass.

**Test**
- Verify table, test column, and change summary are updated.

**Implementation evidence (Story 12)**
- Status: `Completed (Code + Tested)`
- Changes summary:
  - Updated backlog status for PRS-035 to tested closure with repo-wise summary.
  - Added release-note traceability for PRS-035.
  - Updated gap-analysis alignment to reflect Smart Intake closure.
- Call hierarchy:
  - Trigger event: Story implementation merge -> backlog row update.
  - Trigger event: local+cloud pass -> test column update to `Completed`.
  - Trigger event: final closure -> release notes and gap analysis synchronization.

---

## 3) Suggested Execution Cadence for PRS-035

1. Story 1 to 3 (contract + flag + route detector)
2. Story 4 to 6 (warnings + ETA + endpoint)
3. Story 7 to 8 (UI integration + flag behavior)
4. Story 9 to 10 (observability + regression checks)
5. Story 11 to 12 (rollout docs + backlog closure)

Keep each story in a separate commit with `PRS-035` in message.

---

## 4) Ownership Model Per Agent (Mandatory)

Use this structure for every agent story and design review.

### PRS-035 Smart Intake Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-2-stories"></a>
### PRS-036 OCR Quality Agent

**Stage**
- During OCR execution and post-page quality evaluation

**Agent used**
- PRS-036 OCR Quality Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-3-stories"></a>
### PRS-037 Transcription Quality Agent

**Stage**
- During transcription execution and segment quality evaluation

**Agent used**
- PRS-037 Transcription Quality Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-4-stories"></a>
### PRS-038 Retry & Recovery Agent

**Stage**
- During failure handling/recovery after upload is queued

**Agent used**
- PRS-038 Retry & Recovery Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-5-stories"></a>
### PRS-039 Cost Guardrail Agent

**Stage**
- Pre-upload policy decision and upload gating

**Agent used**
- PRS-039 Cost Guardrail Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-6-stories"></a>
### PRS-040 Queue Orchestration Agent

**Stage**
- Queue scheduling and worker dispatch runtime

**Agent used**
- PRS-040 Queue Orchestration Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-7-stories"></a>
### PRS-041 User Assist Agent

**Stage**
- UI interaction layer (pre-upload, in-progress, failure states)

**Agent used**
- PRS-041 User Assist Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-8-stories"></a>
### PRS-042 Incident Triage Agent

**Stage**
- Post-failure operations and support triage

**Agent used**
- PRS-042 Incident Triage Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-9-stories"></a>
### PRS-043 Regression Certification Agent

**Stage**
- Pre-release validation and release gate stage

**Agent used**
- PRS-043 Regression Certification Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

<a id="agent-10-stories"></a>
### PRS-044 Product Insights Agent

**Stage**
- Post-run analytics and product planning stage

**Agent used**
- PRS-044 Product Insights Agent
**Product owns (what and why)**
- Business goals
- User outcomes
- Policy boundaries
- Success metrics

**Engineering owns (how)**
- Agent architecture
- Tooling and integration
- Reliability, safety, observability
- Rollout strategy

**Best practice**
- Define responsibilities together in a joint design doc:
  - Product: intent, scope, guardrails
  - Engineering: execution model, failure handling, controls

---

## 5) Plain-English Benefit Testcases (Before vs After Agents)

Important baseline note:
- Your current platform already has strong checks/balances (validation, quotas, retries, status guards, correlation, regressions).
- So many “before” cases are not hard failures; they are mostly guidance/precision/operability gaps.
- This section focuses on measurable deltas agents should improve.

### PRS-035 Smart Intake Agent (detailed)

1. Ambiguous upload route
- Before: User selects a file with confusing extension/MIME and only sees failure/retry later.
- After: Precheck clearly says “will process as OCR/TRANSCRIPTION”, with reason and confidence.

2. Large file with high processing risk
- Before: Upload is accepted, but user has no early warning about long wait or likely timeout risk.
- After: Precheck warns before enqueue and suggests action (compress/split/shorter input).

3. Long media job expectation mismatch
- Before: User sees only generic progress and may think system is stuck.
- After: ETA/range shown before start; user has realistic expectation.

4. Wrong file chosen accidentally
- Before: Validation may reject later, after user action path.
- After: Intake warns immediately on select/drop with clear next step.

5. Support asks “why was this routed this way?”
- Before: Route reason is implicit.
- After: Decision reason and confidence are logged and auditable.

6. Product asks “did precheck help?”
- Before: No explicit intake conversion metric.
- After: Metrics show warn rate, proceed rate, and post-warning completion rate.

7. Cloud queue spike scenario
- Before: User cannot distinguish queue delay vs processing delay at start.
- After: Intake ETA + route hints reduce false “stuck” perception.

8. Low-confidence detection behavior
- Before: No explicit confidence surfaced.
- After: Low confidence requires clearer warning and optional user override.

9. Feature rollout safety
- Before: Any intake change directly impacts all users.
- After: `FEATURE_SMART_INTAKE` allows shadow mode -> gradual rollout -> rollback.

10. Regression traceability
- Before: Intake behavior not explicitly tested.
- After: Regression scripts assert precheck response shape and route decision consistency.

### PRS-036 OCR Quality Agent
1. Blurry scanned page
- Before: Job may complete with poor text but no quality explanation.
- After: Low-confidence page is flagged with remediation guidance.

### PRS-037 Transcription Quality Agent
1. Noisy audio segment
- Before: Transcript quality drops silently.
- After: Weak segments are identified with confidence and retry recommendation.

### PRS-038 Retry & Recovery Agent
1. Transient provider/network failure
- Before: Generic retry path may be suboptimal.
- After: Policy-based recovery path improves completion and reduces waste.

### PRS-039 Cost Guardrail Agent
1. User submits expensive workload near limit
- Before: Cost/limit impact is visible late.
- After: Early estimate and policy decision are shown before expensive processing.

### PRS-040 Queue Orchestration Agent
1. Mixed OCR + A/V burst traffic
- Before: One workload can dominate queue wait.
- After: Dynamic balancing reduces starvation and improves p95 wait.

### PRS-041 User Assist Agent
1. User sees failure toast
- Before: Error may be correct but next action is unclear.
- After: Contextual next-best action appears immediately.

### PRS-042 Incident Triage Agent
1. Production incident ticket
- Before: Support/dev manually correlate UI/API/Worker logs.
- After: Agent provides probable root cause + runbook steps with evidence links.

### PRS-043 Regression Certification Agent
1. Release readiness decision
- Before: Teams manually combine CI + local/cloud evidence.
- After: Agent emits a single certification verdict with reasoned pass/fail gates.

### PRS-044 Product Insights Agent
1. Roadmap prioritization meeting
- Before: Decisions depend on fragmented anecdotes.
- After: Agent provides trend-backed priority recommendations (usage, failures, drop-offs).

---

## 6) Tiny Stories for All Remaining Agents (`PRS-036` to `PRS-044`)

Note:
- Story format is intentionally small for novice-friendly execution.
- Each story below includes: `Stage`, `Agent used`, `Goal`, `Files`, `Change`, `Test`.

### PRS-036 OCR Quality Agent

<a id="agent-2-story-1"></a>
#### Story 1: Define OCR quality contract
**Stage**
- During OCR execution and post-page quality evaluation
**Agent used**
- OCR Quality Agent (PRS-036)
**Goal**
- Add stable response fields for page confidence and quality hints.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/job_contract.py`
**Change**
- Add `ocr_quality_score`, `low_confidence_pages`, `quality_hints[]`.
**Test**
- Unit test schema serialization and backward compatibility.

**Implementation evidence (Story 1)**
- Status: `Completed (Code + Unit Tested)`
- Changes summary:
  - Added OCR quality contract fields to API job response schema:
    - `ocr_quality_score`
    - `low_confidence_pages`
    - `quality_hints`
  - Added these fields to canonical contract export in API contract schema.
  - Added positive + negative unit tests for quality contract validation and backward-compatible defaults.
- Call hierarchy:
  - Trigger event: API schema validation for status payload.
  - API path: `schemas/responses.py` -> `JobStatusResponse`.
  - Contract path: `schemas/job_contract.py` -> `CANONICAL_FIELDS`.
  - Test path: `tests/test_ocr_quality_contract_unit.py`.
- Files changed:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/job_contract.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-api/tests/test_ocr_quality_contract_unit.py`
- Validation run:
  - `python -m unittest tests.test_ocr_quality_contract_unit -v` -> PASS
  - `python -m unittest tests.test_intake_contract_unit -v` -> PASS

<a id="agent-2-story-2"></a>
#### Story 2: Emit quality metadata from worker OCR path
**Stage**
- During OCR page processing
**Agent used**
- OCR Quality Agent (PRS-036)
**Goal**
- Compute and publish page-level quality signals.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/ocr.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/adapters/status_store.py`
**Change**
- Capture per-page confidence and update status payload.
**Test**
- OCR sample test confirms quality fields are persisted.

**Implementation evidence (Story 2)**
- Status: `Completed (Code + Unit Tested)`
- Changes summary:
  - Added deterministic OCR quality scoring module using Pillow + text heuristics.
  - Integrated scoring in worker OCR pipeline and persisted fields into job status:
    - `ocr_quality_score`
    - `low_confidence_pages`
    - `quality_hints`
  - Added worker unit tests for score boundaries and low-page detection.
- Call hierarchy:
  - Worker path: `run_ocr(...)` -> `gemini_ocr(...)` -> `score_page(...)` per page.
  - Summary path: `summarize_document_quality(...)` -> final status write (`safe_hset`).
  - Event trigger: each OCR page completion updates intermediate quality metrics; final completion writes summary fields.
- Files changed:
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/quality/ocr_quality.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/quality/__init__.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/ocr.py`
  - `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/tests/test_ocr_quality_unit.py`
- Validation run:
  - `python -m py_compile worker/ocr.py worker/quality/ocr_quality.py` -> PASS
  - `python -m unittest tests.test_ocr_quality_unit -v` -> PASS

<a id="agent-2-story-3"></a>
#### Story 3: Show OCR quality guidance in UI
**Stage**
- Post-processing review in UI/history
**Agent used**
- OCR Quality Agent (PRS-036)
**Goal**
- Surface quality warnings and suggestions to users.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/jobs.js`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/partials/history.html`
**Change**
- Add a compact quality badge/warning message for low-confidence outputs.
**Test**
- UI manual test with low-quality sample pages.

**Implementation evidence (Story 3)**
- Status: `Completed (Code + Unit Tested)`
- Changes summary:
  - Added OCR quality badge rendering in history rows with warn/good visual tone.
  - Added robust parsing for worker/API list fields (JSON string or array).
  - Added UI unit tests for positive/negative badge rendering paths.
- Call hierarchy:
  - UI render path: `renderJobsList(...)` -> `buildOcrQualityBadgeHtml(job)` -> `getOcrQualityModel(job)`.
  - Parsing path: `parseQualityList(...)` normalizes `low_confidence_pages` and `quality_hints`.
  - Event trigger: history/jobs data load or refresh updates rendered quality badge state.
- Files changed:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/jobs.js`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/css/features/jobs.css`
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/tests/jobs-quality.test.js`
- Validation run:
  - `npm test` -> PASS

---

### PRS-037 Transcription Quality Agent

#### Story 1: Define transcript-quality contract
**Stage**
- During transcription and segment analysis
**Agent used**
- Transcription Quality Agent (PRS-037)
**Goal**
- Add stable fields for segment confidence and quality flags.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/job_contract.py`
**Change**
- Add `transcription_quality_score`, `low_confidence_segments`, `audio_quality_hints[]`.
**Test**
- Unit test validates field presence and type.

#### Story 2: Emit quality metadata from transcription pipeline
**Stage**
- During chunk transcription
**Agent used**
- Transcription Quality Agent (PRS-037)
**Goal**
- Store segment-level confidence and issue hints.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/transcribe.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/adapters/status_store.py`
**Change**
- Publish confidence summaries in status payload.
**Test**
- Audio sample test verifies quality metadata updates.

#### Story 3: Render transcript-quality hints in UI
**Stage**
- Post-completion result review
**Agent used**
- Transcription Quality Agent (PRS-037)
**Goal**
- Show “quality may be low” hints with next actions.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/jobs.js`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/partials/completion-card.html`
**Change**
- Add quality hint block for completed transcription jobs.
**Test**
- Manual UI test with noisy-audio sample.

---

### PRS-038 Retry & Recovery Agent

#### Story 1: Define recovery decision contract
**Stage**
- Failure handling after processing starts
**Agent used**
- Retry & Recovery Agent (PRS-038)
**Goal**
- Standardize recovery action payload fields.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/error_catalog.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/dead_letter.py`
**Change**
- Add `recovery_action`, `recovery_reason`, `recovery_attempt`.
**Test**
- Unit test maps errors to expected recovery actions.

#### Story 2: Implement policy-based recovery orchestration
**Stage**
- Retry/requeue decision point
**Agent used**
- Retry & Recovery Agent (PRS-038)
**Goal**
- Select action based on error class and budget.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/worker_loop.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/utils/retry_policy.py`
**Change**
- Add action selector: retry, requeue-delay, fail-fast, DLQ.
**Test**
- Failure injection test for transient/media/fatal categories.

#### Story 3: Expose recovery trace in API status
**Stage**
- Post-failure visibility
**Agent used**
- Retry & Recovery Agent (PRS-038)
**Goal**
- Help support understand what was attempted.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/status.py`
**Change**
- Surface recovery fields in failed status payload.
**Test**
- Regression check validates recovery fields for failed jobs.

---

### PRS-039 Cost Guardrail Agent

#### Story 1: Add cost prediction contract
**Stage**
- Pre-upload policy and quota check
**Agent used**
- Cost Guardrail Agent (PRS-039)
**Goal**
- Define response shape for predicted effort/cost.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
**Change**
- Add `estimated_effort`, `estimated_cost_band`, `policy_decision`.
**Test**
- Unit test validates policy response fields.

#### Story 2: Implement policy evaluator service
**Stage**
- Pre-enqueue decision
**Agent used**
- Cost Guardrail Agent (PRS-039)
**Goal**
- Evaluate size/pages/duration/usage against thresholds.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/quota.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/intake_precheck.py`
**Change**
- Add cost/effort projection and decision (`ALLOW/WARN/BLOCK`).
**Test**
- Unit test across boundary values.

#### Story 3: Show estimate and policy message in UI
**Stage**
- Pre-upload user decision
**Agent used**
- Cost Guardrail Agent (PRS-039)
**Goal**
- Show cost/effort estimate before submit.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/upload.js`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/partials/upload-grid.html`
**Change**
- Add estimate text + policy warning area.
**Test**
- Manual UI test with small vs large file.

---

### PRS-040 Queue Orchestration Agent

#### Story 1: Add scheduling policy config contract
**Stage**
- Worker runtime scheduling
**Agent used**
- Queue Orchestration Agent (PRS-040)
**Goal**
- Define configurable scheduling strategy (fairness/priority).
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/startup_env.py`
**Change**
- Add env knobs for scheduling mode and priorities.
**Test**
- Startup validation tests for config values.

#### Story 2: Implement adaptive dequeue logic
**Stage**
- Queue consumption
**Agent used**
- Queue Orchestration Agent (PRS-040)
**Goal**
- Reduce starvation between OCR and A/V workloads.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/worker_loop.py`
**Change**
- Weighted/fair dequeue based on queue pressure.
**Test**
- Load-test simulation with mixed traffic verifies fairness.

#### Story 3: Expose queue-health metrics for tuning
**Stage**
- Ops monitoring
**Agent used**
- Queue Orchestration Agent (PRS-040)
**Goal**
- Provide visibility for scheduling decisions.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-worker/worker/metrics.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/readiness.py`
**Change**
- Publish queue lag and pickup metrics.
**Test**
- Verify metrics update under synthetic queue load.

---

### PRS-041 User Assist Agent

#### Story 1: Define assist-message contract
**Stage**
- UI guidance layer
**Agent used**
- User Assist Agent (PRS-041)
**Goal**
- Standardize “next-best-action” payload.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
**Change**
- Add `assist_message`, `assist_actions[]`, `assist_severity`.
**Test**
- Unit test for assist payload schema.

#### Story 2: Map status/error to assist actions
**Stage**
- API status processing
**Agent used**
- User Assist Agent (PRS-041)
**Goal**
- Generate context-specific guidance from status/error codes.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/status.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/feature_flags.py`
**Change**
- Add rules for queued, failed, cancelled, retryable states.
**Test**
- API test checks message/action mapping per error code.

#### Story 3: Render assist panel in UI
**Stage**
- In-progress and failure UI
**Agent used**
- User Assist Agent (PRS-041)
**Goal**
- Show actionable suggestions, not only error toasts.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/polling.js`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/partials/processing-panel.html`
**Change**
- Add assist panel with top 1-2 actions.
**Test**
- Manual test for failed and queued long-wait scenarios.

---

### PRS-042 Incident Triage Agent

#### Story 1: Define triage report schema
**Stage**
- Incident analysis
**Agent used**
- Incident Triage Agent (PRS-042)
**Goal**
- Standardize incident report output.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/` (new report schema doc or json schema)
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
**Change**
- Define fields: `root_cause_guess`, `evidence[]`, `runbook_steps[]`.
**Test**
- Schema validation test.

#### Story 2: Build correlation collector across logs
**Stage**
- Ops/debug tooling
**Agent used**
- Incident Triage Agent (PRS-042)
**Goal**
- Collect API/Worker traces by `request_id/job_id`.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
**Change**
- Add triage extraction command path and evidence summary.
**Test**
- Simulated failure run produces triage evidence output.

#### Story 3: Generate runbook suggestion output
**Stage**
- Post-failure remediation
**Agent used**
- Incident Triage Agent (PRS-042)
**Goal**
- Suggest top remediation steps automatically.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/RUNBOOKS.md`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/` (triage helper)
**Change**
- Map common failure signatures to runbook links/actions.
**Test**
- Validate known failures map to correct runbook section.

---

### PRS-043 Regression Certification Agent

#### Story 1: Define certification output contract
**Stage**
- Pre-release gate
**Agent used**
- Regression Certification Agent (PRS-043)
**Goal**
- Standardize certification result document.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/FUNCTIONAL_REGRESSION_TESTS.md`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/` (report format note)
**Change**
- Define fields: `checks`, `evidence`, `verdict`, `blockers`.
**Test**
- Schema/format validation check.

#### Story 2: Aggregate CI + local + cloud evidence
**Stage**
- Release evidence collection
**Agent used**
- Regression Certification Agent (PRS-043)
**Goal**
- Build one consolidated release-readiness artifact.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`
**Change**
- Emit cert-friendly summary file with pass/fail gates.
**Test**
- Validate artifact includes all required checks.

#### Story 3: Gate release decision
**Stage**
- Go/No-Go
**Agent used**
- Regression Certification Agent (PRS-043)
**Goal**
- Enforce fail-fast if critical checks fail.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/RELEASE_NOTES.md`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/.github/workflows/ci.yml` (if needed for summary sync)
**Change**
- Add documented certification gate criteria.
**Test**
- Force one check fail and verify verdict is blocked.

---

### PRS-044 Product Insights Agent

#### Story 1: Define product-metric contract
**Stage**
- Analytics model definition
**Agent used**
- Product Insights Agent (PRS-044)
**Goal**
- Define stable KPI schema for usage/outcome insights.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/schemas/responses.py`
**Change**
- Add KPI fields for adoption, completion, drop-off, turnaround.
**Test**
- Unit test for analytics response shape.

#### Story 2: Build analytics aggregation endpoint
**Stage**
- Data aggregation
**Agent used**
- Product Insights Agent (PRS-044)
**Goal**
- Expose filtered product metrics by time window and job type.
**Files**
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/jobs.py`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/services/jobs.py`
**Change**
- Add lightweight aggregation path for dashboard/reporting.
**Test**
- API tests verify metric math with fixture data.

#### Story 3: Surface insights for prioritization
**Stage**
- Product planning
**Agent used**
- Product Insights Agent (PRS-044)
**Goal**
- Produce plain-language top pain points and trend summary.
**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/PRODUCTION_READINESS_BACKLOG.md`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/RELEASE_NOTES.md`
**Change**
- Add recurring insight summary format tied to roadmap decisions.
**Test**
- Validate summary accuracy against known sample metrics.

---

## 7) Plain-English Story Concepts (All Agents)

Purpose:
- Give one consistent, user-centric explanation for each story.
- Clarify what changes in behavior users, ops, dev, and product can actually observe.

### Agent #1 Smart Intake (PRS-035)
- Story 1: Intake contract.  
  Concept: Define one precheck response shape so UI and API speak the same intake language.  
  User sees: Clear route, confidence, warnings, and ETA before upload.  
  Stakeholder value: Dev gets stable contract; Product gets measurable intake funnel fields.
- Story 2: Intake precheck API.  
  Concept: Evaluate file metadata before enqueue to prevent avoidable failures.  
  User sees: Early warning if file type/size/duration is risky.  
  Stakeholder value: Ops sees fewer bad jobs entering queues.
- Story 3: UI precheck panel.  
  Concept: Show precheck outcome before final submit decision.  
  User sees: “Proceed vs fix input” guidance at upload time.  
  Stakeholder value: Product sees lower drop-off from confusing failures.

### Agent #2 OCR Quality (PRS-036)
- Story 1: OCR quality contract.  
  Concept: Add stable fields (`ocr_quality_score`, `low_confidence_pages`, `quality_hints`).  
  User sees: Quality percent and hints in history/completed views.  
  Stakeholder value: Dev/Ops can debug low-quality output with structured metadata.
- Story 2: Worker quality scoring.  
  Concept: Compute deterministic quality from document/image/text signals after OCR.  
  User sees: Poor scans clearly flagged even when job technically completes.  
  Stakeholder value: Product gets a quality KPI instead of binary success/failure.
- Story 3: UI quality rendering.  
  Concept: Convert raw score/hints into understandable UX badges and messages.  
  User sees: Green/amber/red-like quality cues and next actions.  
  Stakeholder value: Support can explain output quality without reading raw logs.

### Agent #3 Transcription Quality (PRS-037)
- Story 1: Transcript quality contract.  
  Concept: Add stable transcript-quality fields for segment confidence and hints.  
  User sees: Quality signals for audio output reliability.  
  Stakeholder value: Dev gets schema consistency with OCR quality design.
- Story 2: Segment scoring in worker.  
  Concept: Score chunk/segment quality to identify weak parts.  
  User sees: Confidence-aware interpretation of transcript quality.  
  Stakeholder value: Ops can isolate low-quality audio causes quickly.
- Story 3: UI transcript hints.  
  Concept: Surface quality summary and remediation tips in UX.  
  User sees: Clear advice when transcript quality is weak.  
  Stakeholder value: Product can prioritize noise/speaker enhancements using evidence.

### Agent #4 Retry & Recovery (PRS-038)
- Story 1: Recovery contract.  
  Concept: Standardize recovery metadata fields across failure flows.  
  User sees: Transparent “what recovery action happened” info.  
  Stakeholder value: Support no longer guesses retry behavior from raw exceptions.
- Story 2: Recovery policy engine.  
  Concept: Choose `retry_with_backoff` vs `fail_fast_dlq` by error class and budget.  
  User sees: Higher completion for transient issues, immediate fail for bad input.  
  Stakeholder value: Ops avoids wasteful retries and manual re-runs.
- Story 3: Recovery trace in API/UI.  
  Concept: Expose recovery decision trace in status/history.  
  User sees: Retry/fail-fast reason directly in failed history rows.  
  Stakeholder value: Product gets auditability for reliability decisions.

### Agent #5 Cost Guardrail (PRS-039)
- Story 1: Cost contract.  
  Concept: Define fields for projected effort/cost and policy decision.  
  User sees: Expected cost/effort before expensive processing starts.  
  Stakeholder value: Product can tune policy using explicit output fields.
- Story 2: Policy evaluator.  
  Concept: Decide `ALLOW/WARN/BLOCK` from size/pages/duration/quota context.  
  User sees: Deterministic acceptance or block with clear reason.  
  Stakeholder value: Ops gets predictable load and spend protection.
- Story 3: UI policy message.  
  Concept: Present projected effort and guardrail decision before submit.  
  User sees: Informed choice to proceed/split/compress file.  
  Stakeholder value: Fewer surprise failures and escalations.

### Agent #6 Queue Orchestration (PRS-040)
- Story 1: Scheduling config contract.  
  Concept: Add explicit knobs for fairness/priority scheduling behavior.  
  User sees: More consistent wait times under mixed load.  
  Stakeholder value: Ops can tune queue policy without code churn.
- Story 2: Adaptive dequeue logic.  
  Concept: Prevent one workload type from starving another.  
  User sees: Better responsiveness during traffic spikes.  
  Stakeholder value: Product gets better p95 wait and completion consistency.
- Story 3: Queue-health metrics.  
  Concept: Publish lag/pickup/pressure metrics for scheduling decisions.  
  User sees: Indirectly fewer “stuck queue” experiences.  
  Stakeholder value: Ops can detect and correct imbalance fast.
- Implementation update (2026-02-20): Worker now applies inflight requeue backoff + stale marker cleanup (`f133018`) and adds adaptive scheduler contract/dequeue logic; API now exposes authenticated `/queue/health` plus contract capability `queue_orchestration_enabled`; UI surfaces queue wait signals (`e37f91e` + follow-up): live queued timer, queue-load hint, and `Fair Scheduler (policy)` badge.

### Agent #7 User Assist (PRS-041)
- Story 1: Assist contract.  
  Concept: Standardize assist message/severity/actions payload.  
  User sees: Consistent actionable help instead of generic errors.  
  Stakeholder value: Dev can add new assist rules safely.
- Story 2: Status-to-assist mapping.  
  Concept: Map state/error patterns to recommended next actions.  
  User sees: Immediate “what to do next” for queue/failure cases.  
  Stakeholder value: Support ticket repetition drops.
- Story 3: Assist panel UI.  
  Concept: Render top actionable guidance inline in processing/failure views.  
  User sees: Contextual help without leaving the screen.  
  Stakeholder value: Product sees higher task completion after issues.
- Implementation update (2026-02-20): API now emits deterministic Hindi assist payloads by `status/error_code` (`services/user_assist.py`, `/status/{job_id}`), and UI now renders assist panel + action button in queued/failed/cancelled states.

### Agent #8 Incident Triage (PRS-042)
- Story 1: Triage report schema.  
  Concept: Define one machine-readable incident report shape.  
  User sees: Faster support turnaround indirectly.  
  Stakeholder value: Ops/dev share one incident language.
- Story 2: Correlation collector.  
  Concept: Auto-link evidence by `request_id`/`job_id` across layers.  
  User sees: Quicker root-cause acknowledgement and fixes.  
  Stakeholder value: MTTR drops because manual log stitching is removed.
- Story 3: Runbook suggestion output.  
  Concept: Suggest likely remediation steps from known signatures.  
  User sees: Faster recovery from common incidents.  
  Stakeholder value: Ops response becomes consistent and repeatable.

### Agent #9 Regression Certification (PRS-043)
- Story 1: Certification contract.  
  Concept: Define pass/fail evidence artifact schema for release readiness.  
  User sees: Safer releases with fewer regressions.  
  Stakeholder value: Product gets objective go/no-go gates.
- Story 2: Evidence aggregation.  
  Concept: Combine CI + local + cloud checks into one report.  
  User sees: Reduced post-release breakages.  
  Stakeholder value: Dev/release teams avoid fragmented validation.
- Story 3: Release gate enforcement.  
  Concept: Block release when critical checks fail.  
  User sees: Stability prioritized over risky speed.  
  Stakeholder value: Ops avoids avoidable incidents after deploy.

### Agent #10 Product Insights (PRS-044)
- Story 1: Product metric contract.  
  Concept: Define stable KPI schema for usage, failure, latency, drop-off.  
  User sees: Improvements guided by real behavior over time.  
  Stakeholder value: Product decisions become evidence-driven.
- Story 2: Aggregation endpoint.  
  Concept: Compute insight-ready metrics by window and job type.  
  User sees: Better-targeted UX and reliability fixes.  
  Stakeholder value: Dev/product can prioritize highest-impact backlog first.
- Story 3: Insight summaries.  
  Concept: Convert metrics into plain-language prioritization signals.  
  User sees: Roadmap improvements aligned to actual pain points.  
  Stakeholder value: Leadership gets clear narrative with measurable impact.

## 8) Repo Role Matrix (Agent + Story)

Purpose:
- Clarify exactly which repo is the decision maker vs middle layer vs presenter for each story.
- Keep implementation ownership explicit for Product/Dev/Ops handoff.

Legend:
- `Primary`: core logic/decision happens here.
- `Middle`: contract/transport/orchestration only.
- `Presentation`: user-facing rendering and messaging.
- `N/A`: no direct change expected.

### Agent #1 (PRS-035) Smart Intake

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Intake contract | Presentation contract mapping | Primary contract schema | N/A |
| S2 Feature flag wiring | Primary capability toggle in client flow | Primary flag gate | N/A |
| S3 Route detector | N/A | Primary decision logic | N/A |
| S4 Precheck warnings | Presentation of warnings | Primary warning generation | N/A |
| S5 ETA estimator | Presentation of ETA | Primary ETA calculation | N/A |
| S6 Precheck endpoint | Calls endpoint | Primary endpoint and payload | N/A |
| S7 UI precheck call | Primary pre-upload UX flow | Middle (responds to precheck) | N/A |
| S8 Flag respect | Primary skip/show behavior | Primary gate enforcement | N/A |
| S9 Observability | N/A | Primary intake telemetry | N/A |
| S10 Regression checks | Primary local/cloud script assertions | Middle (returns payload for assertions) | N/A |
| S11 Rollout docs | Presentation/ops docs | Middle (deployment behavior docs) | N/A |
| S12 Backlog closure | Primary docs updates | N/A | N/A |

### Agent #2 (PRS-036) OCR Quality

| Story | UI | API | Worker |
|---|---|---|---|
| S1 OCR quality contract | N/A | Primary contract schema | N/A |
| S2 Emit worker metadata | N/A | Middle (status passthrough) | Primary quality scoring + persistence |
| S3 UI quality guidance | Primary badge/hints rendering | Middle (payload transport) | Middle (source of fields) |

### Agent #3 (PRS-037) Transcription Quality

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Transcript quality contract | N/A | Primary contract schema | N/A |
| S2 Emit segment quality metadata | N/A | Middle (status passthrough) | Primary segment scoring + persistence |
| S3 UI transcript hints | Primary hint rendering | Middle (payload transport) | Middle (source of fields) |

### Agent #4 (PRS-038) Retry & Recovery

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Recovery contract | N/A | Primary contract schema | Middle (producer alignment) |
| S2 Recovery orchestration | N/A | Middle (policy exposure) | Primary recovery decision engine |
| S3 API recovery trace | Presentation of trace to user/ops | Primary trace response | Middle (trace source) |

### Agent #5 (PRS-039) Cost Guardrail

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Cost contract | N/A | Primary contract schema | N/A |
| S2 Policy evaluator | N/A | Primary allow/warn/block decision | N/A |
| S3 UI estimate message | Primary user messaging | Middle (policy output transport) | N/A |

### Agent #6 (PRS-040) Queue Orchestration

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Scheduling policy config | N/A | Middle (policy config exposure) | Primary scheduling config |
| S2 Adaptive dequeue | N/A | N/A | Primary queue balancing logic |
| S3 Queue health metrics | N/A | Middle (metrics endpoint) | Primary metric emission |

### Agent #7 (PRS-041) User Assist

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Assist contract | Presentation contract usage | Primary contract schema | N/A |
| S2 Status/error -> assist mapping | Presentation rendering targets | Primary mapping service | Middle (error/stage source) |
| S3 Assist panel rendering | Primary UX panel | Middle (assist payload transport) | N/A |

### Agent #8 (PRS-042) Incident Triage

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Triage report schema | N/A | Primary report schema | Middle (source alignment) |
| S2 Correlation collector | N/A | Primary correlation aggregator | Primary log/status evidence source |
| S3 Runbook suggestions | Presentation in ops-facing outputs | Primary suggestion generation | Middle (incident context source) |

### Agent #9 (PRS-043) Regression Certification

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Certification contract | N/A | Middle (optional endpoint/schema) | N/A |
| S2 Aggregate CI/local/cloud evidence | Primary script/report generation | Middle (health/contract evidence) | Middle (processing evidence) |
| S3 Release gate | Primary release docs/gating flow | Middle (gate evidence exposure) | Middle (gate evidence exposure) |

### Agent #10 (PRS-044) Product Insights

| Story | UI | API | Worker |
|---|---|---|---|
| S1 Product metric contract | N/A | Primary KPI contract schema | N/A |
| S2 Analytics aggregation endpoint | N/A | Primary aggregation logic | Middle (raw metric source) |
| S3 Insight summary output | Primary product-facing summary surfaces | Primary insight feed | Middle (source metrics/events) |
