# Contributing (UI)

## Architecture rule
Follow `/ARCHITECTURE.md` layer boundaries before creating/modifying files.

## Mandatory checklist for every backlog item fix
- Mention backlog ID in PR title or description (`PRS-xxx`).
- Add/update logs for key flow points (start, success, failure).
- Keep user-facing error messages deterministic.
- Update docs if contract/behavior changed.
- Add test notes (what was verified locally).
- Add a crisp user-centric comment at file top and at method/function level for every new/modified code file.

## Logging minimum
- Include `job_id` where available.
- Include `request_id` where available.
- Do not log tokens, secrets, or raw personal data.

## Review checklist
- No cross-layer dependency violations.
- No duplicate business logic where utility function exists.
- No silent failures: errors must either be handled or surfaced.
