# Feature Flags

## API flags
- `FEATURE_SMART_INTAKE`
  - `1`: enables Smart Intake precheck capability exposure.
  - `0` (default): disabled; upload behavior stays unchanged.
  - Rollout phases:
    - `shadow`: endpoint live, guidance hidden from users.
    - `visible`: endpoint + guidance visible, upload flow unchanged.
    - `full`: endpoint + guidance + regression assertions enabled.
- `FEATURE_QUEUE_PARTITIONING`
  - `1`: route OCR and TRANSCRIPTION to dedicated queues.
- `FEATURE_UPLOAD_QUOTAS`
  - `1`: enforce daily + active user quota.
- `FEATURE_DURATION_PAGE_LIMITS`
  - `1`: enforce OCR pages and media duration limits.

## Worker controls / rollout flags
- `QUEUE_MODE=single|both|partitioned`
- `WORKER_MAX_INFLIGHT_OCR`
- `WORKER_MAX_INFLIGHT_TRANSCRIPTION`
- `RETRY_BUDGET_TRANSIENT`
- `RETRY_BUDGET_MEDIA`
- `RETRY_BUDGET_DEFAULT`

## UI flags
- `window.FEATURE_COST_HINTS` (in `js/config.js`)
  - enables pre-upload effort/cost hint toasts.
- `window.FEATURE_SMART_INTAKE` (in `js/config.js`)
  - default `false`; enable only when API capability indicates support.

## Rollout pattern
1. Deploy with feature flags OFF.
2. Enable per environment and monitor metrics/logs.
3. Keep quick rollback path by toggling flag to OFF.
4. For Smart Intake, verify `/intake/precheck` and regression precheck assertions before enabling full mode.
