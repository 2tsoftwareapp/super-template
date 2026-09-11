# Configuration — API and worker

## Overview

- API and worker use the same environment loader and validation schema.
- The worker requires `DATABASE_URL` and uses the restricted application role for PostgreSQL RLS.
- The optional replica uses independent `DATABASE_URL_READ_REPLICA` and `DATABASE_URL_TEST_READ_REPLICA` endpoints; primary port resolution does not rewrite them.
- Security-sensitive repositories use `DATABASE_PRIMARY`; a strong read policy cannot be composed with replica routing.
- API-specific listener settings are not used to create a worker listener.
- Provider credentials are only required by the enabled integration path.

## Required configuration

| Area | Configuration | Source |
|---|---|---|
| Environment | `APP_ENV` and environment file layering | `docs/environments.md`, `packages/env-loader/**` |
| Database | `DATABASE_URL`, restricted role, PostgreSQL connection settings | `packages/api-runtime/src/config/environment/env.schema.ts`, `docs/deployment.md` |
| Read replica | `DATABASE_URL_READ_REPLICA`, `DATABASE_URL_TEST_READ_REPLICA`, restricted replica roles | `packages/database-runtime/src/database.provider.ts`, `packages/database-runtime/src/database-rls.guard.ts`, `docs/database.md` |
| Production | non-placeholder secrets, `REDIS_URL`, HTTPS origins/cookies, S3 storage | `packages/api-runtime/src/config/environment/env.schema.ts` |
| Worker role | no `API_PORT` listener; process/log readiness | `apps/worker/src/main.ts`, `docs/deployment.md` |

## Environment behavior

```bash
make dev-api APP_ENV=development
make dev-worker APP_ENV=development
pnpm --filter worker build
pnpm --filter worker start
```

Invalid configuration fails worker startup and sets a non-zero process exit code. Never place secrets in images or logs.

When `database-read-replica` is selected, the runtime checks the primary and
replica roles at startup and rejects a superuser or `BYPASSRLS` role on either
pool. Eligible default reads are eventual; auth sessions, user status,
organization context, access-control permissions, and MFA state are pinned to
the primary through `DATABASE_PRIMARY`. Source: `packages/database-runtime/src/database.provider.ts`,
`packages/database-runtime/src/database-rls.guard.ts`, and the security
repository constructors under `packages/feature-*/src/infrastructure/`.

The real topology E2E is opt-in and requires
`DATABASE_TOPOLOGY_PRIMARY_URL`, `DATABASE_TOPOLOGY_REPLICA_URL`, and
`DATABASE_TOPOLOGY_ADMIN_URL`; without them the Vitest file is skipped. Source:
`apps/api/test/database-topology.e2e.spec.ts`.

Sources: `docs/environments.md`, `docs/deployment.md`, `apps/worker/src/main.ts`, `packages/api-runtime/src/config/environment/env.schema.ts`.
Last-synced: `f50b62e8`.
