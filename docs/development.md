# Development

See [onboarding.md](./onboarding.md) for a first-day walkthrough.

## Node runtime

The workspace requires **Node.js ≥ 24.14.0**: the root `package.json` declares
`engines.node` as `>=24.14.0` and `.nvmrc` pins `24.14.0`. Activate it (`nvm use` or your
version manager) **before** running any `pnpm` command — pnpm itself must run under that
runtime, otherwise it reports `Unsupported engine` and local results can diverge from CI.

## Common Commands

| Goal                     | macOS / Linux             | Cross-platform                |
| ------------------------ | ------------------------- | ----------------------------- |
| First-time setup         | `make bootstrap`          | `pnpm bootstrap`              |
| Validate toolchain + env | —                         | `pnpm run env:doctor`         |
| Start API + Web + Admin  | `make dev`                | `pnpm dev`                    |
| Regenerate contracts     | `make generate`           | `pnpm run generate:contracts` |
| CI-style verify          | `make verify`             | `pnpm verify`                 |
| Mobile doctor            | `pnpm run mobile:doctor`  | same                          |
| Install git hooks        | automatic after bootstrap | `pnpm hooks:install`          |

## Git Hooks (pre-push gate)

`pnpm hooks:install` (run automatically by `pnpm bootstrap`) points
`core.hooksPath` at `.githooks/`, where every push is gated on the same checks
CI enforces:

1. `pnpm run format:check`
2. `pnpm run lint` — source policy chain + turbo lint (catches import-sort)
3. `pnpm run typecheck`

A failing check blocks the push, so import-sort or formatting drift can never
reach CI. Re-run `pnpm hooks:install` after cloning or after adding hooks under
`scripts/hooks/`. To bypass in an emergency: `git push --no-verify` (required
CI checks still run server-side).

### `pnpm typecheck` also compiles test files

A package's `tsconfig.json` excludes `*.spec.ts` so tests never land in build
output — which meant `pnpm typecheck` used to skip them entirely, and a spec
with a real type error could pass every gate. Each package that has specs under
`src/` now ships a sibling `tsconfig.spec.json` that includes those specs, sets
`noEmit`, and adds `types: ["node", "vitest/globals"]`. Its `typecheck` script
runs both programs:

```bash
tsc -p tsconfig.json --noEmit && tsc -p tsconfig.spec.json --noEmit
```

A spec that does not compile therefore fails `pnpm typecheck`. Fix the spec; do
not widen the config. `build` stays test-free. Convention and the two
documented deviations: [`packages/tsconfig/README.md`](../packages/tsconfig/README.md).

## Running Individual Apps

- API: `make dev-api`
- Web: `make dev-web` (needs API in another terminal unless using `make dev`)
- Admin: `make dev-admin` (needs API in another terminal unless using `make dev`)
- Mobile: `make dev-mobile` or `pnpm run mobile:dev`

`make dev` / `pnpm dev` starts Docker (Postgres, Redis, Mailpit), migrates the database, then runs NestJS + both Next.js apps in one terminal. Flutter always runs separately.

## Windows / PowerShell

Use pnpm scripts instead of Make when bash is unavailable:

```powershell
pnpm bootstrap
pnpm run env:doctor
pnpm dev
pnpm run mobile:doctor
pnpm run mobile:setup
pnpm run mobile:dev
```

Full bootstrap: `powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1`

## Local infrastructure (Docker Compose)

| Service    | Default port                   | Required?                                                          |
| ---------- | ------------------------------ | ------------------------------------------------------------------ |
| PostgreSQL | 5432 (`POSTGRES_EXPOSED_PORT`) | Yes                                                                |
| Redis      | 6379 (`REDIS_PORT`)            | Optional — improves throttling/SSE fan-out when `REDIS_URL` is set |
| Mailpit    | 8025 UI / 1025 SMTP            | Yes for email flows in dev                                         |
| MinIO      | 9000 API / 9001 console        | Yes for the S3 integration test                                    |

Override conflicting ports in `.env.local`. The `minio-init` compose service creates the
`S3_BUCKET` after MinIO is healthy; re-run `docker compose -f infra/docker-compose.yml up
minio-init` if the bucket was removed.

## Opt-in integration and e2e suites

Most suites run against mocks and are covered by `pnpm test`. Three suites need real
services and stay behind an explicit switch, so a checkout without Docker still gets a
green default run:

| Suite                            | Command                                          | Prerequisite                                        |
| -------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| S3/MinIO object storage          | `pnpm --filter @repo/feature-upload test:integration` | MinIO up and `S3_BUCKET` created (`minio-init`) |
| Standalone worker (PostgreSQL)   | `pnpm --filter worker test:e2e`                  | PostgreSQL reachable at `POSTGRES_HOST`/`POSTGRES_PORT` |
| API end-to-end                   | `pnpm --filter api test:e2e`                     | same as above                                       |

Each script exports the variable that unhides its suite (`RUN_S3_INTEGRATION=1`,
`WORKER_E2E=1`). Running the same specs without it reports them as **skipped** rather than
passing, so a green `pnpm test` is not evidence for those boundaries. Details and
troubleshooting for the storage boundary:
[`packages/feature-upload/test/integration/README.md`](../packages/feature-upload/test/integration/README.md).

Both PostgreSQL suites reset the same `fullstack_starter_test` database, and both take the
same Postgres advisory lock
([`apps/api/test/support/test-database-lock.ts`](../apps/api/test/support/test-database-lock.ts)
— the worker suite imports that file directly). They can therefore run at the same time
without one dropping the schema the other is testing against; the second one waits.

## Emulator Networking

- iOS simulator: `http://localhost:3001` (base URL; generated client adds `/api/v1`)
- Android emulator: `AppConfig` rewrites `localhost` / `127.0.0.1` to `10.0.2.2`
- Physical device: set `API_BASE_URL` in `apps/mobile/env/dev.json` to your host LAN IP

```powershell
sh scripts/mobile.sh dev --env env/staging.json
```

## Contract Regeneration

```bash
make generate
make generate-check   # non-mutating; used in CI
```

Regenerates OpenAPI, the TypeScript contract package, and (when Docker + Dart are available) the Flutter Dio client.

## Adding a Backend Feature (NestJS)

Backend capabilities are **feature plugin packages** (`packages/feature-<id>`);
`apps/api` is a composition root only and must never grow a business module
folder (`scripts/check-source-policy.sh` rejects `apps/api/src/<feature>`).

1. Scaffold the package: `pnpm scaffold:feature <id>` (kebab-case, e.g.
   `billing`). It creates `packages/feature-<id>/` with the manifest
   (`src/<id>.feature.ts`), the module, the `presentation` / `application` /
   `infrastructure` skeleton, `public/contracts.ts`, and a README.
2. Add the workspace dependency in `packages/app-composition/package.json`:
   `"@repo/feature-<id>": "workspace:*"`.
3. Register the manifest in
   `packages/app-composition/src/feature-registry.ts` (`enabledFeatures`). That
   is the only composition edit — there is no `AppModule` edit.
4. Run `pnpm install` so pnpm links the new package.
5. If the feature owns tables, declare them under
   `src/infrastructure/persistence/` and generate the migration with
   `node scripts/db-generate.mjs` (see [database.md](./database.md)).
6. Add DTO validation and Swagger decorators in `src/presentation/`, then keep
   the gates green:

   ```bash
   sh scripts/check-source-policy.sh
   node scripts/check-feature-manifest-deps.mjs
   node scripts/generate-feature-indexes.mjs --check
   node scripts/check-cross-feature-fks.mjs
   ```

7. Run `make generate` when the HTTP contract changed.

## Adding a Next.js Page

Routes are always locale-prefixed (`/en/...`, `/vi/...`):

1. Add the route under `apps/web/src/app/[locale]/**` (or
   `apps/admin/src/app/[locale]/**`); route entries hold no business logic.
2. Put services, react-query hooks, zod schemas and views under
   `src/features/<resource>/` (`api/`, `model/`, `controllers/`, `screens/`,
   `ui/`) — the ESLint boundary rules reject `app/**` importing
   `@tanstack/react-query` or `@/lib/http`, and `features/**` importing `app/**`.
3. Reach the API through the same-origin BFF (`/api/v1/<rest>` →
   `/api/bff/<rest>`) and use generated contract types from
   `@repo/api-contract`.
4. Keep permission checks in the UI as hints only — the API is the authority.

## Adding a Flutter Feature

1. Add `data/`, `domain/`, and `presentation/` files under
   `apps/mobile/lib/features/<feature>`.
2. Reuse the shared Dio client and secure token storage from
   `apps/mobile/lib/core/` (never a second HTTP client).
3. Prefer generated API DTOs from `apps/mobile/lib/generated/api` over manual
   JSON maps; regenerate with `make generate` instead of hand-editing them.
4. Add widget or state tests under `apps/mobile/test` and run
   `pnpm run mobile:check`.
