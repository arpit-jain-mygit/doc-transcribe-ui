# UI Architecture (`doc-transcribe-ui`)

## Purpose
Define clear boundaries so any engineer can quickly locate where code should live.

## Layers and dependency direction
Allowed direction:
- `partials/` + `css/` + `index.html` -> consumed by `js/ui` layer
- `js/ui` layer -> can call `js/services` layer
- `js/services` layer -> can call `js/core` layer
- `js/core` layer -> no dependency on UI/rendering code

Disallowed direction:
- `js/core` importing from `js/ui`
- rendering files making raw network calls (should go through service functions)

## Current modules (as-is)
- Canonical data contract reference: `JOB_STATUS_CONTRACT.md`
- `js/upload.js`: upload orchestration
- `js/polling.js`: status polling and completion/failure handlers
- `js/jobs.js`: history list loading/filtering/pagination/render
- `js/auth.js`: Google auth/session bootstrap
- `js/ui.js`: shared UI state, toasts, completion card render
- `js/utils.js`: shared formatting/error helpers

## Target module boundaries (incremental)
- `js/views/`: rendering-only modules
- `js/services/`: API and workflow orchestration modules
- `js/core/`: stateless helpers, constants, formatters

## Logging requirements for every backlog item fix
- If behavior changes in UI flow, log at least one debug trail in development mode:
  - start event
  - success/failure event
  - key identifiers (`job_id`, `request_id` when available)
- User-visible errors must be mapped to stable user messages.

## PR placement checklist
- Is code added in the correct layer?
- Did we avoid raw `fetch` calls in rendering-only code?
- Are new constants/helpers placed in shared core utility files?
- Are new user-facing errors mapped consistently?
