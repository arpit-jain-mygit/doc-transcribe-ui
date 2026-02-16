# Functional Regression Test Suite (UI + API + Worker)

Run this suite after every backlog item fix to prevent breakages.

## Execution policy
- After every `PRS-xxx`:
  - Run all `SMOKE` tests.
  - Run all tests tagged with changed repo(s): `UI`, `API`, `Worker`.
  - Run all tests tagged with changed feature(s): `Auth`, `Upload`, `History`, `Cancel`, `Download`, `Queue`.

## Environments
- Local E2E: local UI + local API + local worker + Redis.
- Hybrid E2E: Vercel UI + Render API + local worker (if applicable).

## Local-first quick runner (recommended)

Use this bounded local runner first for every backlog item:

`/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh`

Cloud API runner:
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_cloud.sh`

Stack lifecycle helpers:
- Start local UI+API+worker:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/start_local_stack.sh`
- Stop local UI+API+worker:
  - `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/stop_local_stack.sh`

Default sample file paths expected by runner:
- PDF: `/Users/arpitjain/Downloads/Demo/sample.pdf`
- MP3: `/Users/arpitjain/Downloads/Demo/sample.mp3`

Override examples:

```bash
SAMPLE_PDF="/absolute/path/sample.pdf" \
SAMPLE_MP3="/absolute/path/sample.mp3" \
MAX_WAIT_SEC=90 \
/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh
```

If API requires auth token:

```bash
AUTH_BEARER_TOKEN="<token>" \
/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/run_regression_local.sh
```

Note:
- Current local/cloud API setup expects auth token by default for upload/status routes.
- If token is missing/invalid, runner now prints HTTP status + response body for easier debugging.

Behavior:
- Hard bounded polling (no indefinite waits).
- Fails fast with explicit reason.
- Covers OCR and transcription success paths.

## Test case format
- `ID`
- `Type`: Smoke/Regression
- `Repos`
- `Preconditions`
- `Steps`
- `Expected result`

---

## Core smoke tests (mandatory each PRS)

### FT-SM-01 Sign-in and session restore
- Type: Smoke
- Repos: UI, API
- Preconditions: Valid Google login account.
- Steps:
1. Open UI and sign in.
2. Refresh page.
- Expected result:
  - User stays signed in.
  - No auth error toast.

### FT-SM-02 OCR upload success path
- Type: Smoke
- Repos: UI, API, Worker
- Preconditions: `sample.pdf` available.
- Steps:
1. Upload PDF.
2. Wait for completion.
3. Download output.
- Expected result:
  - Job status: `COMPLETED`.
  - History row appears with metadata.
  - Downloaded file opens correctly.

### FT-SM-03 A/V upload success path
- Type: Smoke
- Repos: UI, API, Worker
- Preconditions: `sample.mp3` available.
- Steps:
1. Upload audio/video.
2. Wait for completion.
3. Download output.
- Expected result:
  - Job status: `COMPLETED`.
  - Duration + processing metadata visible.
  - Output text is readable Unicode.

### FT-SM-04 Cancel running job
- Type: Smoke
- Repos: UI, API, Worker
- Preconditions: Long-running file available.
- Steps:
1. Start upload.
2. Click `Cancel Job` and confirm.
3. Open History -> `Cancelled`.
- Expected result:
  - Status becomes `CANCELLED`.
  - No false “Processing completed” toast.
  - Next upload works normally.

### FT-SM-05 History loading and pagination
- Type: Smoke
- Repos: UI, API
- Preconditions: >= 15 completed jobs.
- Steps:
1. Open History.
2. Verify first page.
3. Click `Load more`.
- Expected result:
  - First response: counts + first page records.
  - Load more appends next page.
  - No duplicates.

---

## Full regression tests

### FT-RG-01 Upload validation (type/size)
- Type: Regression
- Repos: UI, API
- Steps:
1. Try unsupported file extension.
2. Try oversized payload (if limit configured).
- Expected result:
  - Clear validation error message.
  - No job enqueued.

### FT-RG-02 Auth failure handling
- Type: Regression
- Repos: UI, API
- Steps:
1. Use expired/invalid token.
2. Call upload/jobs/status via UI.
- Expected result:
  - Deterministic auth message.
  - Session reset/logout flow works.

### FT-RG-03 `/jobs` filters
- Type: Regression
- Repos: UI, API
- Steps:
1. Switch type tabs (`OCR`, `TRANSCRIPTION`).
2. Switch status dropdown (`Completed`, `Failed`, `Cancelled`).
- Expected result:
  - Correct rows shown for selected type+status.
  - Counts correspond to selected type.

### FT-RG-04 Metadata render consistency
- Type: Regression
- Repos: UI
- Steps:
1. Validate OCR row metadata.
2. Validate A/V row metadata.
- Expected result:
  - `Uploaded file`, `File Size`, `Pages/Duration`, `Processing Time`, `When`.
  - Uniform spacing and font size.

### FT-RG-05 Download output behavior
- Type: Regression
- Repos: UI
- Steps:
1. Download completed output from completion card.
2. Download from history row.
- Expected result:
  - Forced download (not unwanted tab open).
  - Filename handling for special chars is safe.

### FT-RG-06 API non-JSON error handling
- Type: Regression
- Repos: UI, API
- Steps:
1. Simulate 404/500 HTML from route.
- Expected result:
  - UI shows stable fallback error text.
  - No unhandled JSON parse exception in UI.

### FT-RG-07 Worker queue consumption modes
- Type: Regression
- Repos: Worker, API
- Steps:
1. Run worker in `single` mode and submit job.
2. Run worker in `both` mode with local+cloud queues.
- Expected result:
  - Correct queue picked.
  - Correct source classification and DLQ target logs.

### FT-RG-08 DLQ behavior on fatal error
- Type: Regression
- Repos: Worker, API
- Steps:
1. Submit crafted bad job (fatal processing path).
2. Inspect job status and DLQ queue.
- Expected result:
  - Status `FAILED` with clear error/stage.
  - Raw payload moved to configured DLQ.

### FT-RG-09 Redis reconnect resilience
- Type: Regression
- Repos: Worker, API
- Steps:
1. Restart Redis/network during idle and during processing.
- Expected result:
  - Reconnect logs present.
  - Worker recovers without process crash.

### FT-RG-10 CORS/local-render mode compatibility
- Type: Regression
- Repos: UI, API
- Steps:
1. Run UI with render mode.
2. Run UI with local API mode.
- Expected result:
  - Correct API base selected.
  - No unexpected CORS block in intended mode.

### FT-RG-11 Toast and state cleanup
- Type: Regression
- Repos: UI
- Steps:
1. Trigger upload error.
2. Retry upload immediately.
- Expected result:
  - Status panel resets correctly.
  - No stale running-job lock.

### FT-RG-12 Unicode output verification (mobile + desktop)
- Type: Regression
- Repos: UI
- Steps:
1. Download Hindi output on desktop and Android browser.
- Expected result:
  - Text renders correctly (no gibberish encoding issue).

---

## PRS mapping quick matrix
- `PRS-001..004`: run `FT-SM-01..05`, `FT-RG-02`, `FT-RG-06`.
- `PRS-005..012`: run all smoke + `FT-RG-02`, `FT-RG-07..09`.
- `PRS-013..015`: run all smoke + `FT-RG-01`, `FT-RG-02`, `FT-RG-10`.
- `PRS-016..018`: run all smoke + `FT-RG-03`, `FT-RG-04`, `FT-RG-09`.

## Latest verification status
- `PRS-001`
  - Local regression: `PASS` (2026-02-16)
  - Cloud regression: `PASS` (2026-02-16, user-run confirmation)
- `PRS-002`
  - Local regression: `PENDING`
  - Cloud regression: `PENDING`
- `PRS-003`
  - Local regression: `PENDING`
  - Cloud regression: `PENDING`
- `PRS-019..021`: run all smoke + `FT-RG-07..09`.
- `PRS-022..024`: run all smoke + `FT-RG-06`, `FT-RG-07`.
- `PRS-025..027`: run all smoke + `FT-RG-01`, `FT-RG-03`.
- `PRS-028..030`: run full suite.
- `PRS-031..033`: run full suite (plus CI).

## Test result template (copy per PRS)
- `Backlog ID`: PRS-xxx
- `Date`:
- `Environment`:
- `Executed tests`:
- `Pass`:
- `Fail`:

## Latest execution log

- `Backlog ID`: `PRS-001`
- `Date`: `2026-02-16`
- `Environment`: `Local API (127.0.0.1:8090) + local Redis + local worker`
- `Executed tests`: `Local bounded runner (OCR + Transcription success paths)`
- `Pass`:
  - `OCR` completed (`job_id=e77a176513b545ceadb06bfae7f2f346`)
  - `Transcription` completed (`job_id=07bac199dbfd4d84b84902bdfdd7a43b`)
- `Fail`: `None`
- `Notes`:
