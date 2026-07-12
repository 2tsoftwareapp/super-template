# @repo/api-platform

Bounded context: tenant-agnostic platform capabilities.

Modules (each `presentation/ → application/ [→ domain/] → infrastructure/`):

- `jobs` — Postgres-backed queue; lifecycle rules (terminal states, cancel, retry backoff) live in `domain/job-lifecycle.ts`.
- `files` / `storage` / `attachments` — uploads (magic-byte validation in `domain/upload-policy.ts`), versioning, object storage, polymorphic attachments.
- `notifications` / `activities` — inbox, SSE stream, push, activity feed.
- `mail` — templated SMTP delivery + delivery log.
- `audit` — append-only audit trail.
- `imports` / `exports` — CSV import/export framework.
- `settings` — application settings.

⚠ Known hazard: cross-module circular DI here can abort e2e silently — see CLAUDE.md ("Known hazards").
