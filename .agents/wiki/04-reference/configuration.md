# Configuration — API and worker

## Overview

- API and worker use the same environment loader and validation schema.
- The worker requires `DATABASE_URL` and uses the restricted application role for PostgreSQL RLS.
- API-specific listener settings are not used to create a worker listener.
- Provider credentials are only required by the enabled integration path.

## Required configuration

| Area | Configuration | Source |
|---|---|---|
| Environment | `APP_ENV` and environment file layering | `docs/environments.md`, `packages/env-loader/**` |
| Database | `DATABASE_URL`, restricted role, PostgreSQL connection settings | `packages/api-runtime/src/config/environment/env.schema.ts`, `docs/deployment.md` |
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

Sources: `docs/environments.md`, `docs/deployment.md`, `apps/worker/src/main.ts`, `packages/api-runtime/src/config/environment/env.schema.ts`.
Last-synced: `6c3ad242`.
