# @repo/database-runtime

Drizzle pool, RLS/GUC helpers, transactions, and the Nest `DatabaseModule`.

## What lives here

- `database.provider.ts` — tenant-aware pool; tenant GUC re-applied on checkout
- `database-rls.guard.ts` — boot check that every configured runtime pool role cannot bypass RLS
- `drizzle-transaction.service.ts` / `transaction.ts` — transaction ports
- `idempotent-insert.ts`, `postgres-errors.ts` — shared DB helpers
- `schema/` — **empty built-in schema**; tables come from feature packages via
  `FeatureManifest.schema` and are composed in `apps/api`

Tenant ALS / `TenantContextService` and `DATABASE_RUNTIME_ENV` live in
`@repo/api-kernel`. The host's `AppConfigModule` provides `DATABASE_RUNTIME_ENV`
from validated env so this package never depends on `@repo/api-runtime`.

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

## Primary and replica clients

`DATABASE` is the composed client. When `readReplica` is enabled, eligible
select/query/count helpers use `DATABASE_URL_READ_REPLICA` with eventual
consistency; mutations, raw SQL, transactions, migrations, and advisory locks
remain on the primary pool. The runtime does not silently fall back to the
primary after a replica error.

`getPrimaryDatabaseClient()` is the explicit selector for security-sensitive
repositories. Auth sessions, user status, organization context, access-control
permissions, and MFA state resolve the primary through it, so revocation,
rotation, and permission decisions are not served from a lagging replica. The
feature composition layer rejects `readReplica: true` with
`readConsistency: "strong"`; strong reads must use this primary path.

When a replica is configured, `DatabaseRlsGuard` checks both the primary and
replica roles during module initialization and rejects superuser or
`BYPASSRLS` capabilities. `DATABASE_SKIP_RLS_CHECK` is the explicit escape
hatch for local/test use only; deployed environments must leave it unset.
