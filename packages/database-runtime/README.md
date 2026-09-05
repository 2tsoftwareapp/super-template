# @repo/database-runtime

Drizzle pool, RLS/GUC helpers, transactions, and the Nest `DatabaseModule`.

## What lives here

- `database.provider.ts` — tenant-aware pool; tenant GUC re-applied on checkout
- `database-rls.guard.ts` — boot check that the app role cannot bypass RLS
- `drizzle-transaction.service.ts` / `transaction.ts` — transaction ports
- `idempotent-insert.ts`, `postgres-errors.ts` — shared DB helpers
- `schema/` — **empty built-in schema**; tables come from feature packages via
  `FeatureManifest.schema` and are composed in `apps/api`

Tenant ALS / `TenantContextService` currently live in `@repo/api-runtime`
(planned extraction — do not add new coupling).

## Rules

- **Tenant id always comes from the authenticated session** (JWT), never from
  request bodies.
- Feature packages own Drizzle table definitions under
  `packages/feature-*/src/infrastructure/persistence/`.
- Migration SQL is emitted to `apps/api/migrations` (API host owns the migrate
  runner / `__app_migrations` table). Generate with
  `make db-generate` (`pnpm --filter @repo/database-runtime db:generate`).
- Only repositories (in `*/infrastructure/`) may import schema tables;
  application layers never touch drizzle directly (policy-enforced).
