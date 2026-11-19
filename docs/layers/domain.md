# domain/

Pure rules and invariants — the code you can test without a database, a clock or
a framework.

**Put here**

- Policies: `canAccessFile`, `resolveRefreshAttempt`, `user-account.policy`.
- Value rules: normalisation, validation that is not a DTO validator.
- Pure helpers with edge cases worth their own test names.

**Do not put here**

- Nest decorators, Drizzle, `@repo/database-runtime`, `process.env`, `fetch`.
- DTOs, mappers, controllers, repositories.
- Anything whose only test would be a mock assertion.

**Imports allowed**: `@repo/api-kernel` types and pure helpers only. Same-package
`domain/` files. Nothing else.

Enforced by `scripts/check-domain-purity.mjs` (ADR 0001) — type-only framework
imports are the only exception.

Checks: `pnpm run check`.
