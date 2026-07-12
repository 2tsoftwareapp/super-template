# @repo/api-core

Shared backend kernel: everything the bounded-context packages (`api-identity`, `api-platform`) and the API shell need but must not own individually.

## What lives here

| Area | Contents |
|---|---|
| `common/errors` + `filters` | `AppError` (+`ERROR_CODES`) and the global exception filter that maps every failure to the `{ error, meta }` envelope |
| `common/guards` + `decorators` | `AuthorizeGuard` (RBAC: roles = *some*, permissions = *every*, `SUPER_ADMIN` bypass), `@Authorize()`, `@Public()`, `@CurrentUser()`, `@SkipEnvelope()` |
| `common/interceptors` | `ResponseEnvelopeInterceptor` — wraps every response in `{ data, meta.requestId }` |
| `common/rbac` | Role constants + default role→permission grant matrix |
| `common/throttling` / `redis` / `cache` | Redis-backed rate limiting (with in-memory dev fallback) and the access-profile cache |
| `common/logging` / `observability` | Structured logger, error reporter (Sentry/Telegram transports), log redaction |
| `config` | Zod-validated env schema + `EnvironmentService` |
| `ports/` | Cross-context port tokens (audit writer, mail sender, job enqueuer, user/org lookup, …) — bounded contexts talk through these, never import each other directly |

## Conventions

- No feature logic here — if only one bounded context needs it, it belongs to that context.
- `domain/` purity, layering, and index-export rules are enforced by `scripts/check-source-policy.sh`.
