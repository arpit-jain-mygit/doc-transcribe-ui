# UI Job/Status Contract Reference

Canonical source of truth:
- API repo: `/Users/arpitjain/PycharmProjects/doc-transcribe-api/JOB_STATUS_CONTRACT.md`

Contract version expected by UI:
- `2026-02-16-prs-002`

UI consumer rules:
- Prefer canonical fields first (`job_type`, `status`, `input_filename`, `output_filename`, `download_url`, `duration_sec`, `total_pages`).
- Allow backward-compatible fallback aliases only in `js/job-contract.js`.
- New UI code must not read ad-hoc job keys directly when a canonical resolver exists.

Canonical statuses:
- `QUEUED`
- `PROCESSING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

Canonical job types:
- `OCR`
- `TRANSCRIPTION`

Terminal statuses:
- `COMPLETED`
- `FAILED`
- `CANCELLED`
