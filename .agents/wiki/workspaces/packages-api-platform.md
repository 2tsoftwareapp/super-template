# API Platform

## Tổng quan (80/20)

- **Vai trò**: Bounded context platform capabilities — features không gắn với tenant cụ thể.
- **Layer**: platform

## Chi tiết

### Modules

| Module | Chức năng |
|---|---|
| `jobs` | Postgres-backed queue với domain lifecycle |
| `files`/`storage`/`attachments` | Uploads với magic-byte validation, versioning, S3 |
| `notifications`/`activities` | Inbox, SSE, push, activity feed |
| `mail` | Templated SMTP |
| `audit` | Append-only audit trail |
| `imports`/`exports` | CSV framework |
| `settings` | App settings |

### Hazard

Cross-module circular DI có thể abort e2e silently.

### Dependencies workspace

`@repo/api-core`, `@repo/api-database`

---

Nguồn: `packages/api-platform/package.json`, `packages/api-platform/`
Last-synced: `8411838`
