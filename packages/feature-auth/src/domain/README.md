# domain/

Pure rules and invariants — testable without a database, a clock or a framework.

**Put here**
- Policies and value rules with edge cases (`canAccessFile`, `refresh-rotation`).
- Pure helpers that deserve their own test names.

**Do not put here**
- Nest decorators, Drizzle, `process.env`, `fetch`, DTOs, mappers, repositories.
- Anything whose only test would be a mock assertion.

Enforced by `scripts/check-domain-purity.mjs`. Rules: `docs/layers/domain.md`.
