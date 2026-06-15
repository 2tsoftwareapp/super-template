# Development

## Common Commands

- `make bootstrap`
- `make dev`
- `make generate`
- `make verify`
- `make test-api`
- `make test-web`
- `make test-mobile`

## Running Individual Apps

- API: `make dev-api`
- Web: `make dev-web`
- Mobile: `make dev-mobile`

`make dev` starts PostgreSQL, Mailpit, NestJS, and Next.js. Flutter still runs separately on a selected device or simulator.

## Emulator Networking

- iOS simulator: `http://localhost:3001/api/v1`
- Android emulator: `http://10.0.2.2:3001/api/v1`
- physical device: use the host machine LAN IP

Adjust `apps/mobile/env/*.json` or pass a different `--dart-define-from-file`.

## Contract Regeneration

```bash
make generate
```

This regenerates OpenAPI output plus TypeScript and Dart clients.

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
