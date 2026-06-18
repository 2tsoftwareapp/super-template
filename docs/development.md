# Development

## Common Commands

- `make bootstrap`
- `make dev`
- `make generate`
- `make verify`
- `make test-api`
- `make test-web`
- `make test-mobile`
- `pnpm run mobile:doctor`
- `pnpm run mobile:setup`
- `pnpm run mobile:dev`
- `pnpm run mobile:test`
- `pnpm run mobile:format-check`

## Running Individual Apps

- API: `make dev-api`
- Web: `make dev-web`
- Admin: `make dev-admin`
- Mobile: `make dev-mobile`

`make dev` starts PostgreSQL, Mailpit, NestJS, Next.js, and the separate admin Vite app. Flutter still runs separately on a selected device or simulator.

On Windows/PowerShell, prefer the Node-based mobile commands over shell-specific `make` targets:

```powershell
pnpm run mobile:doctor
pnpm run mobile:setup
pnpm run mobile:dev
```

`mobile:doctor` validates `flutter` and `dart` on `PATH` and then runs `flutter doctor`. `mobile:setup` runs `flutter pub get` inside `apps/mobile`.
`mobile:format-check` runs `dart format --set-exit-if-changed .` inside `apps/mobile`.

## Emulator Networking

- iOS simulator: `http://localhost:3001/api/v1`
- Android emulator: `http://10.0.2.2:3001/api/v1`
- physical device: use the host machine LAN IP

Adjust `apps/mobile/env/*.json` or pass a different `--dart-define-from-file`.

Example:

```powershell
sh scripts/mobile.sh dev --env env/staging.json
```

## Contract Regeneration

```bash
make generate
```

This regenerates the API OpenAPI document, the TypeScript contract package, and the Dart client used by Flutter.

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
