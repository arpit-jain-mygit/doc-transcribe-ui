# Runbooks

## 1) Jobs stuck in `QUEUED`
- Check API queue name config:
  - `QUEUE_NAME`, or partitioned mode: `QUEUE_NAME_OCR` / `QUEUE_NAME_TRANSCRIPTION`.
- Check worker consume mode:
  - `QUEUE_MODE=single|both|partitioned`.
- Confirm worker queue targets in logs (`QUEUE_TARGETS=`).
- Validate Redis connectivity:
  - API `/ready`
  - `python -m worker.readiness`

## 2) Frequent `INFRA_REDIS` / `INFRA_GCS`
- Verify dependency readiness first:
  - API `/ready`
  - Worker readiness script.
- Check retry budget envs on worker:
  - `RETRY_BUDGET_TRANSIENT`, `RETRY_BUDGET_MEDIA`, `RETRY_BUDGET_DEFAULT`.
- Check DLQ growth (`doc_jobs_dead` and partition DLQs).

## 3) CORS/upload blocked from Vercel
- Confirm API env:
  - `CORS_ALLOW_ORIGINS` includes exact UI origin (no trailing slash mismatch).
- Hit preflight manually:
  - browser DevTools network for `OPTIONS /upload`.
- Check API startup log for `cors_configured`.

## 4) Quota/limit errors at upload
- Errors:
  - `USER_DAILY_QUOTA_EXCEEDED`
  - `USER_ACTIVE_QUOTA_EXCEEDED`
  - `PAGE_LIMIT_EXCEEDED`
  - `DURATION_LIMIT_EXCEEDED`
- Review API env:
  - `FEATURE_UPLOAD_QUOTAS`
  - `FEATURE_DURATION_PAGE_LIMITS`
  - `DAILY_JOB_LIMIT_PER_USER`
  - `ACTIVE_JOB_LIMIT_PER_USER`
  - `MAX_OCR_PAGES`
  - `MAX_TRANSCRIPTION_DURATION_SEC`

## 5) Concurrency tuning
- Worker controls:
  - `WORKER_MAX_INFLIGHT_OCR`
  - `WORKER_MAX_INFLIGHT_TRANSCRIPTION`
- If throttling observed, increase limits carefully and monitor failure rate + queue depth.

## 6) Smart Intake rollout / rollback
- Shadow mode:
  - Keep `FEATURE_SMART_INTAKE=1` only in API capability checks, but do not surface UI guidance.
  - Verify API `/intake/precheck` returns deterministic `detected_job_type`, `warnings`, `eta_sec`, `confidence`.
- Visible mode:
  - Enable Smart Intake UI hints.
  - Confirm uploads still use existing `/upload` behavior (guidance only, no forced route overrides).
- Full mode:
  - Keep Smart Intake visible and run local/cloud regression with precheck assertions enabled.
- Rollback:
  - Set `FEATURE_SMART_INTAKE=0` in API/UI config and redeploy.
  - Validate `/intake/precheck` returns feature-disabled and upload flow continues normally.
