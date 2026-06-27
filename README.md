<h1 align="center">Super Template</h1>

<p align="center">
  <strong>Production-ready full-stack monorepo for web, admin, mobile, and API.</strong>
  <br /><br />
  <a href="https://github.com/truongnat/super-template/actions/workflows/ci.yml"><img src="https://github.com/truongnat/super-template/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Node.js-24+-339933?logo=node.js&logoColor=white" alt="Node.js 24+" />
  <img src="https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white" alt="pnpm 11" />
  <img src="https://img.shields.io/badge/Turborepo-2-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" />
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick Start</strong></a>
  &nbsp;·&nbsp;
  <a href="#features"><strong>Features</strong></a>
  &nbsp;·&nbsp;
  <a href="#architecture"><strong>Architecture</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/environments.md"><strong>Environments</strong></a>
  &nbsp;·&nbsp;
  <a href="#documentation"><strong>Docs</strong></a>
</p>

<br />

One PostgreSQL schema. One OpenAPI contract. Four clients — authentication, RBAC, admin tooling, and environment layering included. Clone it, run `make bootstrap`, and start building your product instead of rebuilding boilerplate.

<br />

## Quick start

**Prerequisites:** Node 24 · pnpm 11 · Docker · Flutter (mobile only)

Works out of the box with committed `.env.development` defaults. Put personal secrets in `.env.local` (gitignored).

```bash
git clone https://github.com/truongnat/super-template.git && cd super-template
make bootstrap    # deps · infra · migrate · seed · codegen
make dev          # API :3001 · Web :3000 · Admin :3002
make dev-mobile   # Flutter (separate terminal)
```

<table>
  <tr>
    <td align="center"><strong>Web</strong><br /><a href="http://localhost:3000">localhost:3000</a><br /><sub>landing + auth</sub></td>
    <td align="center"><strong>Admin</strong><br /><a href="http://localhost:3002">localhost:3002</a><br /><sub>operations</sub></td>
    <td align="center"><strong>API</strong><br /><a href="http://localhost:3001/api/docs">localhost:3001</a><br /><sub>REST + Swagger</sub></td>
    <td align="center"><strong>Mailpit</strong><br /><a href="http://localhost:8025">localhost:8025</a><br /><sub>dev email</sub></td>
  </tr>
</table>

<details>
<summary><strong>Windows / PowerShell</strong></summary>

```powershell
pnpm run mobile:doctor
pnpm run mobile:setup
pnpm run mobile:dev
```

</details>

<br />

## Architecture

<pre>
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     Web      │   │    Admin     │   │    Mobile    │
│  Next.js BFF │   │  Next.js BFF │   │    Flutter   │
│   :3000      │   │   :3002      │   │  iOS/Android │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          ▼
               ┌─────────────────────┐
               │     NestJS API      │
               │  OpenAPI · JWT · RBAC│
               │       :3001         │
               └──────────┬──────────┘
                          ▼
               ┌─────────────────────┐
               │     PostgreSQL      │
               │  Drizzle · RLS role │
               └─────────────────────┘
</pre>

Shared packages: `@repo/web-core` · `@repo/env-loader` · `@repo/api-contract`

<br />

## Features

- [x] **Contract-first API** — OpenAPI from NestJS; TypeScript + Dart clients via `make generate`
- [x] **Authentication** — JWT rotation, Argon2id, CSRF, RBAC, TOTP MFA, GitHub / Google / Apple SSO
- [x] **Admin dashboard** — users, roles, projects, jobs, mail, imports/exports, audit logs, SSE notifications
- [x] **Flutter mobile** — Material 3 design system, 20+ widgets, in-app UI Kit gallery, optional FCM push
- [x] **Environment layering** — `development` · `staging` · `production` across API, web, admin, and mobile
- [x] **CI pipeline** — `make verify` runs generate-check, lint, typecheck, tests, and builds

<br />

## Documentation

| | |
|---|---|
| [Environments](docs/environments.md) | Dev / staging / prod config layering |
| [Architecture](docs/architecture.md) | System design and module boundaries |
| [Authentication](docs/authentication.md) | Sessions, cookies, SSO, MFA |
| [Database](docs/database.md) | Drizzle, migrations, RLS |
| [Development](docs/development.md) | Local workflow and conventions |
| [Deployment](docs/deployment.md) | Production deployment guide |
| [Mobile design system](apps/mobile/design-system/MASTER.md) | Flutter tokens and components |

<br />

<details>
<summary><strong>Repository layout</strong></summary>

```text
super-template/
├── apps/
│   ├── api/              NestJS REST API
│   ├── admin/            Next.js operations dashboard
│   ├── web/              Next.js landing + auth BFF
│   └── mobile/           Flutter + design-system/
├── packages/
│   ├── api-core/         Config, env schema, ports
│   ├── api-identity/     Auth, users, SSO, MFA
│   ├── api-workspace/    Projects, orgs, notifications
│   ├── api-contract/     Generated OpenAPI client
│   ├── env-loader/       Layered .env loading
│   └── web-core/         Shared auth + HTTP layer
├── infra/                Docker Compose
├── scripts/              bootstrap · dev · verify
└── docs/
```

</details>

<details>
<summary><strong>Commands</strong></summary>

| Command | Description |
|---------|-------------|
| `make bootstrap` | First-time setup |
| `make dev` | API + Web + Admin |
| `make dev-api` / `dev-web` / `dev-admin` | Single surface |
| `make dev-mobile` | Flutter (dev env) |
| `make dev-mobile-staging` | Flutter (staging env) |
| `make db-migrate` / `db-seed` / `db-generate` | Database |
| `make generate` | Regenerate OpenAPI + clients |
| `make verify` | Full CI pipeline |
| `make test-mobile` | Flutter tests |

</details>

<details>
<summary><strong>Environments</strong></summary>

All surfaces use **`APP_ENV`**: `development` (default) · `staging` · `production`.

Node apps load env via `@repo/env-loader` (process env → `.env.<env>.local` → `.env.local` → `.env.<env>` → `.env.example`).

Mobile uses `apps/mobile/env/{dev,staging,prod}.json`.

```bash
make dev-api APP_ENV=staging
make dev-mobile-staging
```

→ [docs/environments.md](docs/environments.md)

</details>

<details>
<summary><strong>Seeded accounts</strong></summary>

| Role | Email |
|------|-------|
| Admin | `admin@example.local` |
| User | `user@example.local` |

Passwords: `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD` in `.env.local`.

Sign in at Web `/login` or Admin `/login`.

</details>

<details>
<summary><strong>Troubleshooting</strong></summary>

| Issue | Fix |
|-------|-----|
| Postgres not ready | `docker compose -f infra/docker-compose.yml ps` |
| Auth / cookies fail | Check `WEB_ORIGIN`, `ADMIN_ORIGIN`, `API_INTERNAL_URL` |
| Flutter missing | `pnpm run mobile:doctor` |
| Android can't reach API | Use `10.0.2.2:3001` in `apps/mobile/env/dev.json` |
| Stale codegen | `make generate` |
| Port conflict | Override `*_PORT` in `.env.local` |

</details>

<details>
<summary><strong>Production checklist</strong></summary>

- Replace JWT secrets, seed credentials, MFA encryption key
- Set `APP_ENV=production`, `COOKIE_SECURE=true`, HTTPS origins
- Disable or protect Swagger in production
- Inject secrets from your orchestrator — never commit them
- Keep generated clients in sync (`make generate-check` in CI)

</details>

<details>
<summary><strong>Firebase push (optional)</strong></summary>

Firebase is for **mobile FCM only**. Without it, inbox still works.

Add `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` to `.env.local` and platform config in the Flutter app.

→ [apps/mobile/README.md](apps/mobile/README.md)

</details>

<details>
<summary><strong>Agent browser control</strong></summary>

`packages/extension` connects Playwright MCP to a real browser for agent-driven testing (`make extension-dev`).

→ [packages/extension/README.md](packages/extension/README.md)

</details>

<br />

<p align="center">
  <sub>MIT License · Built with NestJS, Next.js, Flutter, and Turborepo</sub>
</p>

<a id="license"></a>
