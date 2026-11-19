# presentation/

The HTTP edge: routing, validation, auth, response shaping.

**Put here**

- `*.controller.ts` — route + `@Authorize` + DTO in, use-case out. No SQL, no
  branching business rules.
- `dto/` — request and response classes with class-validator/`ApiProperty`.
- Nothing else. A controller that needs logic calls `application/`.

**Do not put here**

- Repository or Drizzle access.
- Another feature's internals.
- Error JSON built by hand — throw `AppError` and let the global filter format it.
- `@Public()` without a comment explaining why the route is unauthenticated.

**Response shape**: `ApiDataResponse` / `ApiArrayResponse` / `ApiPaginatedResponse`
from `@repo/api-runtime`. Pagination uses the shared page-meta helper, not a
local `Math.ceil(total / limit)`.

**Imports allowed**: `@repo/api-runtime`, `@repo/api-kernel` types, own
`application/` and `dto/`.

Checks: `pnpm run check`; HTTP behaviour needs an `apps/api/test/*.e2e.spec.ts`.
