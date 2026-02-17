# Production Environment Checklist

Use this checklist before running cloud regression or production releases.

## API (Render: `doc-transcribe-api`)

Required:
- `GOOGLE_CLIENT_ID`
- `REDIS_URL`
- `QUEUE_NAME`
- `DLQ_NAME`
- `GCS_BUCKET_NAME`
- `CORS_ALLOW_ORIGINS` (must include `https://doc-transcribe-ui.vercel.app` without trailing slash issues)

Feature flags:
- `FEATURE_QUEUE_PARTITIONING=0|1`
- `FEATURE_UPLOAD_QUOTAS=0|1`
- `FEATURE_DURATION_PAGE_LIMITS=0|1`

If queue partitioning is enabled:
- `QUEUE_NAME_OCR` (example: `doc_jobs_ocr`)
- `QUEUE_NAME_TRANSCRIPTION` (example: `doc_jobs_transcription`)

Quota and limits:
- `DAILY_JOB_LIMIT_PER_USER` (`0` disables)
- `ACTIVE_JOB_LIMIT_PER_USER` (`0` disables)
- `MAX_OCR_PAGES` (`0` disables)
- `MAX_TRANSCRIPTION_DURATION_SEC` (`0` disables)
- `MAX_OCR_FILE_SIZE_MB`
- `MAX_TRANSCRIPTION_FILE_SIZE_MB`

## Worker (Render: `doc-transcribe-worker`)

Required:
- `REDIS_URL`
- `GCP_PROJECT_ID`
- `GCS_BUCKET_NAME`
- `PROMPT_FILE`
- `PROMPT_NAME`

Queue routing:
- `QUEUE_MODE=single|both|partitioned`
- `single`: `QUEUE_NAME`, `DLQ_NAME`
- `both`: `LOCAL_QUEUE_NAME`, `LOCAL_DLQ_NAME`, `CLOUD_QUEUE_NAME`, `CLOUD_DLQ_NAME`
- `partitioned`: `OCR_QUEUE_NAME`, `OCR_DLQ_NAME`, `TRANSCRIPTION_QUEUE_NAME`, `TRANSCRIPTION_DLQ_NAME`

Concurrency and retries:
- `WORKER_MAX_INFLIGHT_OCR`
- `WORKER_MAX_INFLIGHT_TRANSCRIPTION`
- `RETRY_BUDGET_TRANSIENT`
- `RETRY_BUDGET_MEDIA`
- `RETRY_BUDGET_DEFAULT`

Tuning:
- `TRANSCRIBE_CHUNK_DURATION_SEC`
- `OCR_DPI`
- `OCR_PAGE_BATCH_SIZE`

## UI (Vercel: `doc-transcribe-ui`)

Required:
- `API_BASE` or equivalent frontend API endpoint config must point to Render API URL.

Validation:
- Open browser devtools and confirm CORS preflight success for `/upload`.
- Run `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh` after deployment.
