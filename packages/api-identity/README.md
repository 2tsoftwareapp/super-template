# @repo/api-identity

Bounded context: who you are and what you may do.

Modules (each `presentation/ → application/ → domain/ → infrastructure/`):

- `auth` — register, login, refresh **rotation with a 60s reuse-grace window** (`domain/refresh-rotation.policy.ts`), logout, email verification, password reset, session management.
- `mfa` — TOTP setup/confirm/disable + recovery codes.
- `sso` — provider SSO (Google/Apple) with redirect allowlist.
- `users` — self-service profile + admin user management.
- `organizations` — tenants, membership, roles, switch-organization.
- `access-control` — dynamic roles/permissions backing `@Authorize()`.
- `preferences` — user preferences (theme/language/timezone).

Cross-context consumers use the port tokens from `@repo/api-core` (e.g. `USER_LOOKUP`, `ORGANIZATION_LOOKUP`) — not direct imports.
