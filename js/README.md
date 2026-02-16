# JS Module Map

Current structure:
- `auth.js`: sign-in/out and session restore
- `upload.js`: upload and preflight/upload error handling
- `polling.js`: job status polling and job lifecycle transitions
- `jobs.js`: history fetch, filter, pagination, row rendering
- `ui.js`: global UI helpers, toasts, workspace switch, completion card
- `job-contract.js`: canonical job/status contract constants and field resolvers
- `utils.js`: shared helpers (status formatting, error message parsing)
- `config.js`, `state.js`, `main.js`: app config/state bootstrapping

Boundary guidance:
- Rendering logic stays in UI/view modules.
- API calls and workflow orchestration belong to service-oriented modules.
- Formatting and reusable helpers belong to shared utility modules.
