# Mobile

Flutter client for Super Template.

## Run

- `make dev-mobile` launches the app with `apps/mobile/env/dev.json`
- `make test-mobile` runs the Flutter test suite
- `make generate` refreshes the generated API client before Flutter codegen

## Environment Files

- `apps/mobile/env/dev.json`
- `apps/mobile/env/staging.json`
- `apps/mobile/env/prod.json`

## Networking

- iOS simulator: `http://localhost:3001/api/v1`
- Android emulator: `http://10.0.2.2:3001/api/v1`
- physical device: use the host machine LAN IP

## Generated Client

The generated Dart API client lives in `lib/generated/api`.
It is produced from the API OpenAPI document by `make generate`.
