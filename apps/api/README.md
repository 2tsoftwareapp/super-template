# API

NestJS backend for Super Template.

## Run

Prefer the root scripts so the API stays aligned with the rest of the monorepo:

- `make dev-api` to run the backend in watch mode
- `make test-api` to run the API test suite
- `make db-generate` to generate a Drizzle migration
- `make db-migrate` to apply migrations
- `make db-seed` to seed local development data

## Contract Generation

- `pnpm --filter api openapi:generate` writes `apps/api/openapi.json`
- `pnpm --filter api contract:generate` refreshes `packages/api-contract/src/generated/index.ts`
- `make generate` runs the full contract pipeline, including the Flutter client

## Local Docs

- Swagger UI: `http://localhost:3001/api/docs`
- Swagger JSON: `http://localhost:3001/api/docs-json`

## Schema

The Drizzle schema lives in `packages/api-database/src/schema.ts`.
Generated SQL migrations are written under `packages/api-database/drizzle/`.
