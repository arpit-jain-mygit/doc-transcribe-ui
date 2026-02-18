# Agentic AI Implementation Guide

This document is the dedicated implementation guide for agent backlog items:
- `PRS-035` to `PRS-044`

It is written for beginners. It explains:
1. What each agent does.
2. Who benefits (Users / Dev / Ops / Product).
3. How to implement the first agent (`PRS-035`) in tiny stories (file-by-file, no full code dump).

## 1) Agent Catalog (What + Who benefits)

| PRS | Agent | What it does | Users | Dev | Ops | Product |
|---|---|---|---|---|---|---|
| PRS-035 | Smart Intake Agent | Auto-route + prechecks + ETA before enqueue | Fewer bad uploads | Fewer edge-case bugs | Less avoidable failure load | Better upload conversion |
| PRS-036 | OCR Quality Agent | OCR confidence + low-quality page hints | Better OCR quality | Better quality signals | Earlier quality issue detection | Quality KPI tracking |
| PRS-037 | Transcription Quality Agent | Segment confidence + noise/speaker hints | Better transcripts | Better diagnostics | Faster noisy-audio triage | Trust improvements |
| PRS-038 | Retry & Recovery Agent | Policy-based recovery actions | Higher completion | Cleaner recovery logic | Lower manual retries | Stability gains |
| PRS-039 | Cost Guardrail Agent | Cost/limit prediction + enforcement | Clear limits | Safer controls | Cost/load control | Better unit economics |
| PRS-040 | Queue Orchestration Agent | Dynamic balancing and prioritization | Lower waits | Better scheduler logic | Less contention | Better peak UX |
| PRS-041 | User Assist Agent | Next-best-action guidance in UI | Clearer journey | Reusable guidance patterns | Fewer support tickets | Lower drop-off |
| PRS-042 | Incident Triage Agent | Cross-layer root-cause helper | Faster resolution | Faster debugging | Lower MTTR | Reliability confidence |
| PRS-043 | Regression Certification Agent | Auto certify release readiness | Fewer regressions | Faster release checks | Predictable deploy quality | Safer release cadence |
| PRS-044 | Product Insights Agent | Usage/failure trend analysis | Better UX over time | Data-backed prioritization | Trend visibility | Better roadmap decisions |

---

## 2) PRS-035 Smart Intake Agent (Tiny Stories)

Important:
- Start with deterministic rules (no LangChain/LangGraph needed).
- Keep each story small and independently testable.
- Do not change user behavior abruptly: use feature flags.

### Story 1: Add intake contract (data shape only)

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

---

### Story 2: Add feature flag wiring (off by default)

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

---

### Story 3: Build deterministic route detector service

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

---

### Story 4: Build precheck warning service

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

---

### Story 5: Add simple ETA estimator service

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

---

### Story 6: Add intake precheck API endpoint

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

---

### Story 7: UI precheck call on file selection

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

---

### Story 8: Respect feature flag in UI/API

**Goal**
- Keep old behavior when disabled.

**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/js/config.js`
- `/Users/arpitjain/PycharmProjects/doc-transcribe-api/routes/intake.py`

**Change**
- If flag off: hide precheck UI and skip endpoint usage.

**Test**
- Compare behavior with `FEATURE_SMART_INTAKE=0` vs `1`.

---

### Story 9: Add observability for intake decisions

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

---

### Story 10: Add regression checks for precheck

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

---

### Story 11: Document rollout and rollback

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

---

### Story 12: Backlog and closure updates

**Goal**
- Maintain traceability.

**Files**
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/PRODUCTION_READINESS_BACKLOG.md`
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/CURRENT_STATE_AND_GAP_ANALYSIS.md`

**Change**
- Update PRS-035 status: `Completed (Code)` then `Completed (Tested)` only after local+cloud pass.

**Test**
- Verify table, test column, and change summary are updated.

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

### PRS-036 OCR Quality Agent
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

### PRS-037 Transcription Quality Agent
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

### PRS-038 Retry & Recovery Agent
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

### PRS-039 Cost Guardrail Agent
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

### PRS-040 Queue Orchestration Agent
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

### PRS-041 User Assist Agent
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

### PRS-042 Incident Triage Agent
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

### PRS-043 Regression Certification Agent
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

### PRS-044 Product Insights Agent
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
