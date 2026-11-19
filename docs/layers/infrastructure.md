# infrastructure/

Everything that talks to the outside world: the database, storage, mail, Redis,
provider SDKs.

**Put here**

- `persistence/` — Drizzle table definitions and row types for this feature.
- `*.repository.ts` — every query this context owns. Take
  `TransactionExecutor` (opaque) and narrow inside the class, never in callers.
- Adapters to external services (S3, SMTP, Push, OIDC).

**Do not put here**

- Business decisions (those belong in `domain/` or `application/`).
- HTTP concerns, DTOs, controllers.
- A repository interface with a single implementation — inject the class.

**Imports allowed**: `@repo/database-runtime`, `@repo/api-kernel`, own
`domain/` + `application/ports/`, provider SDKs declared in this package's
`package.json` only.

Multi-write operations use `TransactionPort`; reads that authorize a request use
the primary client (`findByIdStrong`-style methods), never a replica.

Checks: `pnpm run check`; schema changes need a migration and `pnpm run schema:check`.
