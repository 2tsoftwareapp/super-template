# API Identity

## Tổng quan (80/20)

- **Vai trò**: Bounded context identity & access — who you are and what you may do.
- **Layer**: identity
- **Package lớn nhất** trong backend.

## Chi tiết

### Modules

| Module | Chức năng |
|---|---|
| `auth` | Register, login, refresh token rotation (60s reuse grace), email verify, password reset, sessions |
| `mfa` | TOTP + recovery codes |
| `sso` | Google/Apple SSO |
| `users` | Self-service + admin CRUD |
| `organizations` | Tenants, membership, roles, switch-org |
| `access-control` | Dynamic RBAC |
| `preferences` | Theme, language, timezone |

### Architecture mỗi module

`presentation/ → application/ → domain/ → infrastructure/`

### Cross-context

Exposes port tokens qua `@repo/api-core` (e.g., `USER_LOOKUP`, `ORGANIZATION_LOOKUP`).

### Dependencies workspace

`@repo/api-core`, `@repo/api-database`

---

Nguồn: `packages/api-identity/package.json`, `packages/api-identity/`
Last-synced: `8411838`
