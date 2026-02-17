# Load Test Baseline

Use the baseline runner to certify 5/10 concurrent-user acceptance.

## Script
- `/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/load_test_baseline.sh`

## Default behavior
- Submits OCR jobs in batches with concurrency `5` and `10`.
- Polls each job until terminal status.
- Prints summary per batch:
  - `completed`, `failed`, `cancelled`, `timeout`, `duration_sec`.

## Example
```bash
API_BASE="https://doc-transcribe-api.onrender.com" \
CONCURRENCY_LEVELS="5 10" \
/Users/arpitjain/VSProjects/doc-transcribe-ui/scripts/load_test_baseline.sh
```

## Inputs
- Token source: `scripts/.auth_token.local` (JSON with `token` key).
- Sample PDF: `/Users/arpitjain/Downloads/Demo/sample.pdf`

## Pass guideline (baseline)
- `timeout=0`
- `failed <= 10%` for each batch
- no persistent queue growth after run
