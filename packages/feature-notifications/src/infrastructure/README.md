# infrastructure/

Everything that talks to the outside world.

**Put here**
- `persistence/` — Drizzle tables and row types for this feature.
- `*.repository.ts` — every query this context owns. Accept the opaque
  `TransactionExecutor` and narrow it inside the class.
- Adapters to external services (storage, mail, Redis, OIDC).

**Do not put here**
- Business decisions, HTTP concerns, DTOs.
- A repository interface with one implementation — inject the class.

Rules: `docs/layers/infrastructure.md`. Schema changes need a new migration.
