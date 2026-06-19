# Super Template

Production-oriented reusable full-stack starter with:

- NestJS API
- Next.js App Router client web with a backend-for-frontend layer
- Next.js App Router admin app with shadcn UI and TanStack
- Flutter mobile client
- PostgreSQL
- Drizzle ORM with `pg`
- OpenAPI contract generation
- Docker Compose for local infrastructure

## Stack

- Backend: NestJS 11, Swagger, JWT, Argon2id, Drizzle ORM, PostgreSQL
- Web: Next.js 16, React 19, Tailwind CSS, TanStack Query, React Hook Form, Zod
- Admin: Next.js 16, React 19, Tailwind CSS, TanStack Query/Table
- Mobile: Flutter stable, Riverpod, Go Router, Dio, secure storage
- Tooling: pnpm workspaces, Turborepo, Biome for backend, ESLint for web, Makefile

## Repository Layout

```text
super-template/
├── apps/
│   ├── api/
│   ├── admin/
│   ├── mobile/
│   └── web/
├── infra/
│   └── docker-compose.yml
├── packages/
│   ├── api-bootstrap/
│   ├── api-contract/
│   ├── api-core/
│   ├── api-database/
│   ├── api-health/
│   ├── api-identity/
│   ├── api-platform/
│   ├── api-workspace/
│   ├── eslint-config/
│   └── tsconfig/
├── scripts/
├── docs/
└── .github/workflows/
```

## Prerequisites

- Node.js 24.x
- pnpm 11.x via Corepack
- Flutter stable
- Docker
- PostgreSQL client tools (`psql`)

## Quick Start

```bash
cp .env.example .env
make bootstrap
make dev
```

Run Flutter separately because it needs a selected simulator or device:

```bash
make dev-mobile
```

On Windows/PowerShell, use the cross-platform mobile scripts instead of relying on `make`:

```powershell
pnpm run mobile:doctor
pnpm run mobile:setup
pnpm run mobile:dev
```

## Local URLs

- Web: `http://localhost:3000`
- Admin: `http://localhost:3002`
- API: `http://localhost:3001/api/v1`
- Swagger UI: `http://localhost:3001/api/docs`
- Swagger JSON: `http://localhost:3001/api/docs-json`
- Mailpit: `http://localhost:8025`

If port `3000` is already occupied locally, override `WEB_PORT`, `WEB_ORIGIN`, and `NEXT_PUBLIC_WEB_URL` in `.env`.
If port `3002` is already occupied locally, override `ADMIN_PORT` in `.env`.

## Environment

Copy `.env.example` to `.env` and adjust as needed.

Key variables:

- `DATABASE_URL` (restricted application role — RLS enforced at runtime)
- `DATABASE_MIGRATE_URL` (privileged role for `db:migrate` / `db:reset`)
- `DATABASE_URL_TEST`
- `WEB_ORIGIN`
- `API_INTERNAL_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`
- `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (optional — mobile push via Firebase)

The API validates environment variables at startup and fails fast on invalid or missing values.

## Firebase / FCM (mobile push — optional)

Web notifications use **SSE**, not Firebase. Firebase is for **mobile FCM push** only.

Setup: place `google-services.json` (and optionally `GoogleService-Info.plist`) in the Flutter app, then add `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY` to the root `.env`.

See [apps/mobile/README.md](apps/mobile/README.md#push-notifications-fcm) for step-by-step instructions.

## Commands

- `make bootstrap`
- `make dev`
- `make dev-api`
- `make dev-web`
- `make dev-admin`
- `make dev-mobile`
- `pnpm run mobile:doctor`
- `pnpm run mobile:setup`
- `pnpm run mobile:dev`
- `pnpm run mobile:test`
- `pnpm run mobile:format-check`
- `make infra-up`
- `make infra-down`
- `make db-generate`
- `make db-migrate`
- `make db-seed`
- `make db-reset`
- `make db-studio`
- `make generate`
- `make lint`
- `make format`
- `make test`
- `make test-api`
- `make test-web`
- `make test-mobile`
- `make build`
- `make verify`

## Database Workflow

```bash
make infra-up
make db-migrate
make db-seed
```

Generate a new SQL migration after schema changes:

```bash
make db-generate
make db-migrate
```

## Contract Generation

```bash
make generate
```

This regenerates:

- `apps/api/openapi.json`
- `packages/api-contract/src/generated/`
- `apps/mobile/lib/generated/api/`

## Testing

- API: `pnpm --filter api test`
- Web: `pnpm --filter web test`
- Mobile: `pnpm run mobile:test`

`make verify` runs generation, lint, typecheck, tests, and builds. When Flutter/Dart are available it also runs Flutter format-check, analyze, and tests; otherwise it skips the mobile verification path with an explicit message.

## Seeded Development Accounts

- Admin: `admin@example.local`
- User: `user@example.local`

Passwords come from `.env`:

- `SEED_ADMIN_PASSWORD`
- `SEED_USER_PASSWORD`

## Troubleshooting

- If `make bootstrap` fails waiting for PostgreSQL, inspect `docker compose -f infra/docker-compose.yml ps` and container logs.
- If the web app cannot authenticate, verify `WEB_ORIGIN`, `API_INTERNAL_URL`, and cookie settings.
- If Flutter is not installed on this machine yet, start with `pnpm run mobile:doctor`; it prints the expected next step instead of failing deep inside Make/bash.
- If Flutter cannot reach the backend on emulator or device, use the environment guidance in [Development](docs/development.md).
- If generated client files drift, rerun `make generate`.

## Production Notes

- Keep Swagger disabled or protected in production.
- Replace development JWT secrets, cookie settings, and seed credentials.
- Use HTTPS so secure cookies can be enabled.
- Keep generated OpenAPI clients under source control and fail CI on stale output.

See the detailed documents:

- [Architecture](docs/architecture.md)
- [Authentication](docs/authentication.md)
- [Database](docs/database.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [ERD](docs/erd.md)
