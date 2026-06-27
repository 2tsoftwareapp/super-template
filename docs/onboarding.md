# Day 1 onboarding

Quick path to a working local stack on your first day with Super Template.

## What you get in one session

| Surface | URL | Terminal |
| --- | --- | --- |
| Web | http://localhost:3000 | shared with `make dev` / `pnpm dev` |
| Admin | http://localhost:3002 | shared with `make dev` / `pnpm dev` |
| API + Swagger | http://localhost:3001/api/docs | shared with `make dev` / `pnpm dev` |
| Mailpit | http://localhost:8025 | Docker (auto-started) |
| Mobile | device / simulator | **separate terminal** (`make dev-mobile` or `pnpm run mobile:dev`) |

Plan for **two terminals** if you want web + mobile together.

## Prerequisites

- **Node.js 24.14+** — use `.nvmrc` (`nvm use`) or install from nodejs.org
- **pnpm 11.7+** — `corepack enable && corepack prepare pnpm@11.7.0 --activate`
- **Docker Desktop** — Postgres, Redis, and Mailpit run in Compose
- **Flutter** (mobile only) — optional on day 1; web/API/admin work without it

## First-time setup

### macOS / Linux

```bash
git clone https://github.com/truongnat/super-template.git
cd super-template
make bootstrap    # or: pnpm bootstrap
pnpm run env:doctor
make dev          # or: pnpm dev
```

### Windows (PowerShell)

```powershell
git clone https://github.com/truongnat/super-template.git
cd super-template
pnpm bootstrap
pnpm run env:doctor
pnpm dev
```

Or run `powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1` directly.

## Sign in

Seeded accounts (defaults from `.env.example`):

| Role | Email | Password env var | Default |
| --- | --- | --- | --- |
| Admin | `admin@example.local` | `SEED_ADMIN_PASSWORD` | `ChangeMe123!` |
| User | `user@example.local` | `SEED_USER_PASSWORD` | `ChangeMe123!` |

Use Web `/login` or Admin `/login`. Override passwords in `.env.local` if needed.

## Mobile (optional)

```bash
pnpm run mobile:doctor
pnpm run mobile:setup
pnpm run mobile:dev
```

- **iOS simulator:** `localhost:3001` works (via `apps/mobile/env/dev.json`)
- **Android emulator:** `AppConfig` rewrites `localhost` → `10.0.2.2` automatically
- **Physical device:** set `API_BASE_URL` in `apps/mobile/env/dev.json` to your machine's LAN IP

## After you change the API

```bash
make generate        # OpenAPI + TypeScript + Dart clients
make generate-check  # CI-style drift check (non-mutating)
```

Requires **Docker + Dart** on your machine to refresh the Flutter client; otherwise the committed client is kept.

## Staging / production locally

1. Copy `.env.staging.example` → `.env.staging` (or production equivalent)
2. Fill secrets from your secret store — never commit `.env.staging` / `.env.production`
3. Run `pnpm run env:doctor` with `APP_ENV=staging`
4. `make dev-api APP_ENV=staging`

See [environments.md](./environments.md).

## When something breaks

| Symptom | What to check |
| --- | --- |
| Bootstrap fails on ports | `pnpm run env:doctor` — override `POSTGRES_EXPOSED_PORT`, `REDIS_PORT`, or `*_PORT` in `.env.local` |
| Login / cookies fail | `WEB_ORIGIN`, `ADMIN_ORIGIN`, `API_INTERNAL_URL` match your ports |
| Mobile can't reach API | API running? Android uses `10.0.2.2`; physical device needs LAN IP |
| Stale API types | `make generate` then commit generated files |
| Docker not running | Start Docker Desktop before `bootstrap` or `dev` |

## Read next

1. [development.md](./development.md) — daily commands
2. [authentication.md](./authentication.md) — cookies, JWT, MFA, SSO
3. [architecture.md](./architecture.md) — module boundaries
4. [database.md](./database.md) — migrations and RLS roles
