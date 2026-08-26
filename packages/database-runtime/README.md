# @repo/database-runtime

Drizzle schema, migrations support, and the multi-tenant (RLS) database runtime.

## What lives here

- `schema/identity/**`, `schema/platform/**` — one file per table group, mirroring the bounded contexts.
- `tenant-context.ts` / `tenant-context.service.ts` — sets `app.tenant_id` / `app.user_id` / `app.bypass_rls` GUCs; `WORKER_DISPATCH_CONTEXT` for cross-tenant job dispatch.
- `database-rls.guard.ts` — verifies at boot that the app role cannot bypass RLS (fails fast on a misconfigured role).
- `database.provider.ts` — tenant-aware pool: the tenant context is re-applied on every connection checkout.
- `idempotent-insert.ts`, `postgres-errors.ts`, `transaction.ts` — shared DB helpers.

## Rules

- **Tenant id always comes from the authenticated session** (JWT), never from request bodies.
- Migrations are plain numbered SQL in `drizzle/` (this package), applied by `pnpm --filter api db:migrate` (custom runner, `__app_migrations` table). Generate with `make db-generate` (`pnpm --filter api-database db:generate`).
- Only repositories (in `*/infrastructure/`) may import from this package's schema; application layers never touch drizzle directly (policy-enforced).
