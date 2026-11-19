# Lean template v2 — plan

Two templates, one repo, two branches:

| Branch | Role |
| --- | --- |
| `main` (default) | the **simple** template: same platforms, clean code, no ceremony |
| `max` | the **complex** template (today's code), kept for systems that need it |

`max` is already pushed at the current `main` commit. Nothing is rewritten until
the lean tree passes the same gates; the switch is a deliberate, announced step.

## What "simple" means

Same rulebook (`AGENTS.md`, clean code), fewer moving parts:

| Today (`max`) | Lean (`main`) |
| --- | --- |
| 25 `feature-*` packages + manifests + registry | one `apps/api`, each feature a **folder** under `src/modules/` |
| 51 ports, 16 adapters | 3 ports: storage, mailer, job queue (real boundaries) |
| 108 use-case classes | service methods; a use-case only for a multi-write transaction |
| OpenAPI + TS/Dart codegen | hand-written request functions + shared types |
| Turbo + 44 `turbo.json` | pnpm workspaces only (`pnpm -r` orders by dependency) |
| Redis for cache/queue/SSE | Postgres only: jobs table, polling notifications |
| RLS, tenants, org model, SSO, MFA | single tenant, email+password, refresh rotation |
| 20 features | 7: auth, users, jobs, mail, upload, notifications, worker host |

Non-goals (documented, not accidental): multi-tenancy, SSO/MFA, audit export,
import/export, capability variants. Each can come back as an ADR in a fork.

## Target tree

```
apps/
  api/        NestJS: src/modules/{auth,users,jobs,mail,upload,notifications}
              src/shared/{guards,filters,pagination,errors}  src/main.ts
  web/        Next.js: landing + login/verify
  admin/      Next.js: login, users CRUD, jobs, uploads, notifications
  mobile/     Flutter: login, home, profile
  worker/     one process: polls the jobs table, runs handlers
packages/
  db/         Drizzle schema, client, migrations (one folder, no per-feature split)
  config/     zod env schema shared by api/worker
```

A feature folder is: `<name>.controller.ts`, `<name>.service.ts`,
`<name>.repository.ts`, `<name>.dto.ts`, `__tests__/`. That is the whole
convention — no manifest, no layer folder unless the feature has real domain
rules.

## Phases (each ends green on `pnpm run check`)

| Phase | Deliverable | Acceptance |
| --- | --- | --- |
| P0 | workspace skeleton, `packages/config`, `packages/db`, docker-compose (Postgres + Mailpit) | `pnpm -r typecheck` green; `pnpm dev` boots |
| P1 | auth: login, refresh rotation, logout, guards, BFF cookie flow | e2e: login → me → refresh → logout |
| P2 | users: list/create/update/status/delete + roles (single `role` column) | e2e CRUD + admin screens |
| P3 | upload: local disk + S3-compatible via `StoragePort` | e2e upload/download |
| P4 | jobs + worker: jobs table, `SKIP LOCKED` claim, retries, admin view | worker runs a job end-to-end |
| P5 | mail + notifications: Mailpit in dev, DB notifications + polling | send mail on user create; notification visible |
| P6 | web landing + mobile (login, home), docs (`AGENTS.md` ≲80 lines, `CONVENTIONS.md` ≲100), CI | all four surfaces run against the same API |

Target size: **~12k LOC**, 5 workspaces, ≤5 CI jobs.

## Guardrails while building

- Every phase carries its tests; no phase merges with a skipped test.
- Reuse the good parts of `max` verbatim where they are already simple: env
  loading, error envelope, bcrypt/argon2 usage, the admin table primitives.
- Do not port the plugin system, the capability variants, or the use-case
  skeleton "for consistency".
- The folder-README generator stays: it is cheap and keeps folders self-describing.

## Switch-over (needs an explicit go-ahead)

1. Build on branch `lean`, CI green (or local `pnpm run check` until billing is fixed).
2. `git push origin lean:main --force-with-lease`, with `max` already holding the old tree.
3. Set the repo default branch to `main`, protect it, and point `README.md` at the
   two tracks (`main` = simple, `max` = complex).
4. Announce in `CHANGELOG.md`; old links to `max` keep working.
