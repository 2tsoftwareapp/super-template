# API Core

## Tổng quan (80/20)

- **Vai trò**: Shared backend kernel — mọi thứ bounded-context packages và API shell cần nhưng không sở hữu riêng.
- **Layer**: core

## Chi tiết

### Nội dung

| Module | Nội dung |
|---|---|
| `common/errors` | AppError + error codes |
| `common/filters` | Global exception filter |
| `common/guards` | AuthorizeGuard (RBAC) |
| `common/decorators` | @Authorize, @Public, @CurrentUser, @SkipEnvelope |
| `common/interceptors` | ResponseEnvelopeInterceptor |
| `common/rbac` | Role/permission matrix |
| `common/throttling/redis/cache` | Rate limiting + caching |
| `common/logging/observability` | Sentry/Telegram |
| `config/` | Zod env schema + EnvironmentService |
| `ports/` | Cross-context port tokens |

### Dependencies workspace

`@repo/api-sort`, `@repo/config`, `@repo/env-loader`, `@repo/utils`

---

Nguồn: `packages/api-core/package.json`, `packages/api-core/`
Last-synced: `8411838`
