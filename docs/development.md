# Development

See [onboarding.md](./onboarding.md) for a first-day walkthrough.

## Common Commands

| Goal | macOS / Linux | Cross-platform |
| --- | --- | --- |
| First-time setup | `make bootstrap` | `pnpm bootstrap` |
| Validate toolchain + env | — | `pnpm run env:doctor` |
| Start API + Web + Admin | `make dev` | `pnpm dev` |
| Regenerate contracts | `make generate` | `pnpm run generate:contracts` |
| CI-style verify | `make verify` | `pnpm verify` |
| Mobile doctor | `pnpm run mobile:doctor` | same |

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

| Service | Default port | Required? |
| --- | --- | --- |
| PostgreSQL | 5432 (`POSTGRES_EXPOSED_PORT`) | Yes |
| Redis | 6379 (`REDIS_PORT`) | Optional — improves throttling/SSE fan-out when `REDIS_URL` is set |
| Mailpit | 8025 UI / 1025 SMTP | Yes for email flows in dev |

Override conflicting ports in `.env.local`.

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

## Adding a NestJS Module

1. Create a new feature module under `apps/api/src/modules`
2. Add controller, service, and repository code
3. Add DTO validation and Swagger decorators
4. Register the module in `AppModule`
5. Add tests and rerun `make generate` if the contract changes

## Adding a Next.js Page

1. Add route under `apps/web/src/app`
2. Prefer server-safe data access through `/api/bff/*` or dedicated auth handlers
3. Use generated contract types from `@repo/api-contract`
4. Keep permission checks in UI as hints only

## Adding a Flutter Feature

1. Add domain, data, and presentation files under `apps/mobile/lib/features`
2. Reuse the shared Dio client and secure token storage
3. Prefer generated API DTOs over manual JSON maps
4. Add widget or state tests under `apps/mobile/test`
