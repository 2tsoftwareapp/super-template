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
  <a href="docs/onboarding.md"><strong>Onboarding</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/environments.md"><strong>Environments</strong></a>
  &nbsp;·&nbsp;
  <a href="#documentation"><strong>Docs</strong></a>
</p>

<br />

One PostgreSQL schema. One OpenAPI contract. Four clients — authentication, RBAC, admin tooling, and environment layering included. Clone it, run `make bootstrap` (or `pnpm bootstrap`), and start building your product instead of rebuilding boilerplate.

<br />

## Quick start

**Prerequisites:** Node **24.14+** (see `.nvmrc`) · pnpm **11.7+** · Docker · Flutter (mobile only)

Works out of the box with committed `.env.development` + `.env.example` defaults. Put personal overrides and secrets in `.env.local` (gitignored).

```bash
git clone https://github.com/truongnat/super-template.git && cd super-template
make bootstrap    # or: pnpm bootstrap
pnpm run env:doctor
make dev          # API :3001 · Web :3000 · Admin :3002
make dev-mobile   # Flutter — separate terminal
```

<table>
  <tr>
    <td align="center"><strong>Web</strong><br /><a href="http://localhost:3000">localhost:3000</a><br /><sub>SEO landing</sub></td>
    <td align="center"><strong>Admin</strong><br /><a href="http://localhost:3002">localhost:3002</a><br /><sub>primary app + auth BFF</sub></td>
    <td align="center"><strong>API</strong><br /><a href="http://localhost:3001/api/docs">localhost:3001</a><br /><sub>REST + Swagger</sub></td>
    <td align="center"><strong>Mailpit</strong><br /><a href="http://localhost:8025">localhost:8025</a><br /><sub>dev email</sub></td>
  </tr>
</table>

<details>
<summary><strong>Windows / PowerShell</strong></summary>

```powershell
pnpm bootstrap
pnpm run env:doctor
pnpm dev
pnpm run mobile:doctor
pnpm run mobile:setup
pnpm run mobile:dev
```

</details>

<br />

## Make it yours

After clicking **Use this template** (or cloning), rebrand everything in one step:

```bash
node scripts/rename.mjs "Your Project Name" --author your-github-handle
```

This rewrites every casing of the template name (`super-template`, `super_template`,
`SuperTemplate`, `Super Template`) and the original repo owner across all tracked
files — package names, the Dart client, docker services, UI strings, and URLs. It
also sets the mobile application identifier: Android `namespace` + `applicationId`
and the iOS `PRODUCT_BUNDLE_IDENTIFIER` become `com.<project name>.app` (see
`apps/mobile/README.md`). Add `--dry-run` to preview without writing. Afterward,
update the `LICENSE` copyright holder, then run `pnpm install && pnpm generate` and
`pnpm lint && pnpm typecheck`. Mobile release signing stays project-owner work —
see `apps/mobile/README.md` → "Release signing".

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
               └──────────┬──────────┘
                          │
               ┌──────────┴──────────┐
               │  Redis (optional)   │
               │  Mailpit (dev SMTP) │
               └─────────────────────┘
</pre>

Shared packages: `@repo/web-ui` · `@repo/web-hooks` · `@repo/web-utils` · `@repo/env-loader` · `@repo/api-contract`

<br />

## Features

- [x] **Contract-first API** — OpenAPI from NestJS; TypeScript + Dart clients via `make generate`
- [x] **Authentication** — JWT rotation, Argon2id, CSRF, RBAC, TOTP MFA, OIDC SSO backend (Google / Apple / GitHub; configure credentials + UI)
- [x] **Tenant database topology** — PostgreSQL RLS, optional eventual read replica, primary-pinned security decisions, and a selectable organization model (`org-optional`: users work without an organization, or `personal-orgs`: every user gets one)
- [x] **Admin dashboard** — users, roles, jobs, mail, imports/exports, audit logs, SSE notifications
- [x] **Flutter mobile** — Material 3 design system, 20+ widgets, in-app UI Kit gallery, optional FCM push
- [x] **Environment layering** — `development` · `staging` · `production` across API, web, admin, and mobile
- [x] **CI pipeline** — `pnpm run generate:check`, lint, typecheck, tests, build, and Flutter checks (see `.github/workflows/ci.yml`)

### Create a customized project

Select feature packages from `packages/feature-*` and generate a separate project
with the complete transitive dependency closure:

```bash
pnpm create:project --target ../my-project
# Use ↑/↓ to navigate, Space to select packages, and Enter to confirm.
```

The generator rewrites the API workspace dependencies and composition registry,
records the requested/resolved IDs in `feature-profile.json`, and supports
`--dry-run` for preview or `--check` for drift detection. For CI or other
non-interactive runs, pass feature IDs explicitly:

```bash
pnpm create:project --features auth,import-export --target ../my-project --skip-install
```

Two capability switches ride along as explicit flags:

```bash
# Tenant isolation: shared-schema (default) or schema-per-tenant
pnpm create:project --tenant-mode schema-per-tenant --target ../my-project
# Organization model: personal-orgs (default) or org-optional
pnpm create:project --org-model org-optional --target ../my-project
```

The generator does not create a git repository for you — run `git init` in the
new project. Because the generated manifests no longer match the copied
`pnpm-lock.yaml`, `pnpm install` is required before anything uses
`--frozen-lockfile`; `--refresh-lockfile` re-resolves the lockfile without a
full install. `scripts/rename.mjs` works in either case (it falls back to a
filesystem walk when the project is not a git repository yet).

Generated feature selection is immutable for an existing target. A later run
with a different selection fails before writing; create a new target when the
feature set must change. This protects user-owned files from generator cleanup.

The current generator mutates the API surface; unsupported surface requests fail
explicitly.

Existing generated targets are profile-immutable: if a later selection changes
the recorded feature closure, tenant mode, replica capability, or surface, the
generator fails before writing and asks you to create a new target. This avoids
deleting or silently leaving stale files that may have been edited by the
target owner. Re-running with the same profile remains supported, and
`--check` applies the same profile guard.

<br />

## Documentation

|                                                             |                                          |
| ----------------------------------------------------------- | ---------------------------------------- |
| [Onboarding](docs/onboarding.md)                            | Day 1 setup — terminals, ports, accounts |
| [Environments](docs/environments.md)                        | Dev / staging / prod config layering     |
| [Architecture](docs/architecture.md)                        | System design and module boundaries      |
| [Authentication](docs/authentication.md)                    | Sessions, cookies, SSO, MFA              |
| [Database](docs/database.md)                                | Drizzle, migrations, RLS                 |
| [Development](docs/development.md)                          | Local workflow and conventions           |
| [Deployment](docs/deployment.md)                            | Production deployment guide              |
| [Mobile design system](apps/mobile/design-system/MASTER.md) | Flutter tokens and components            |

<br />

<details>
<summary><strong>Repository layout</strong></summary>

```text
super-template/
├── apps/
│   ├── api/              NestJS REST API — composition root + feature registry
│   ├── admin/            Next.js operations dashboard
│   ├── web/              Next.js landing + auth BFF
│   └── mobile/           Flutter + design-system/
├── packages/
│   ├── api-kernel/       Framework-free ports, errors, types
│   ├── api-plugin-kit/   FeatureManifest + compose helpers
│   ├── api-runtime/      Nest HTTP runtime (env, guards, filters)
│   ├── database-runtime/ Drizzle pools, RLS, transactions, primary pinning
│   ├── feature-*/        Compile-time capability plugins
│   ├── api-contract/     Generated OpenAPI client
│   ├── env-loader/       Layered .env loading
│   └── web-ui/           Shared React UI component library
├── infra/                Docker Compose
├── scripts/              bootstrap · dev · verify
└── docs/
```

</details>

<details>
<summary><strong>Database topology</strong></summary>

The default runtime uses `DATABASE_URL` for the restricted primary database
role. Selecting `database-read-replica` adds
`DATABASE_URL_READ_REPLICA` (and `DATABASE_URL_TEST_READ_REPLICA` for tests).
These replica URLs are independent endpoints: primary port discovery may
rewrite the primary URL, but it never rewrites replica hosts or ports.

Eligible default reads use the replica with eventual consistency. Mutations,
transactions, raw SQL, migrations, advisory locks, and security-sensitive
auth/users/organizations/access-control/MFA repositories resolve the primary
via `getPrimaryDatabaseClient()`. The runtime checks every configured pool at
startup and rejects superuser or `BYPASSRLS` roles. A `readReplica=true` plus
`readConsistency=strong` composition is rejected before startup because strong
routing is primary-only.

For the real PostgreSQL topology suite, provide a migrated restricted-role
primary/replica pair and a privileged admin URL targeting the primary:

```bash
DATABASE_TOPOLOGY_PRIMARY_URL='postgresql://app@primary/app' \
DATABASE_TOPOLOGY_REPLICA_URL='postgresql://app@replica/app' \
DATABASE_TOPOLOGY_ADMIN_URL='postgresql://admin@primary/app' \
pnpm --filter api exec vitest run test/database-topology.e2e.spec.ts
```

The suite exercises tenant A/B RLS isolation, endpoint separation, immediate
primary visibility after auth rotation/revocation, and an optional privileged
replica negative case using `DATABASE_TOPOLOGY_PRIVILEGED_REPLICA_URL`.
Without the three required topology URLs, Vitest skips the file; the optional
negative case is skipped when its URL is absent. This is separate from
`pnpm test:e2e:preflight`, which requires `DATABASE_URL_TEST` and a restricted
test role. Never commit connection strings or credentials.

→ [docs/database.md](docs/database.md) · [docs/deployment.md](docs/deployment.md)

</details>

<details>
<summary><strong>Commands</strong></summary>

| Command                                           | Description                          |
| ------------------------------------------------- | ------------------------------------ |
| `make bootstrap` / `pnpm bootstrap`               | First-time setup (cross-platform)    |
| `pnpm run env:doctor`                             | Validate toolchain + env layering    |
| `make dev` / `pnpm dev`                           | API + Web + Admin                    |
| `make dev-api` / `dev-web` / `dev-admin`          | Single surface                       |
| `make dev-mobile`                                 | Flutter (dev env)                    |
| `make dev-mobile-staging`                         | Flutter (staging env)                |
| `make db-migrate` / `db-seed` / `db-generate`     | Database                             |
| `make generate`                                   | Regenerate OpenAPI + clients         |
| `make generate-check` / `pnpm run generate:check` | Verify generated output is committed |
| `make verify` / `pnpm verify`                     | Local CI-style verify                |
| `pnpm run verify:stack`                           | Boot infra + API + worker + Web + Admin and run the [test matrix](docs/testing/test-matrix.md) |
| `make test-mobile`                                | Flutter tests                        |

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

| Role  | Email                 |
| ----- | --------------------- |
| Admin | `admin@example.local` |
| User  | `user@example.local`  |

Passwords: `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD` in `.env.example` (override in `.env.local` if needed).

Sign in at Web `/login` or Admin `/login`.

</details>

<details>
<summary><strong>Troubleshooting</strong></summary>

| Issue                     | Fix                                                                             |
| ------------------------- | ------------------------------------------------------------------------------- |
| Postgres not ready        | `docker compose -f infra/docker-compose.yml ps`                                 |
| Port 5432 / 6379 conflict | Override `POSTGRES_EXPOSED_PORT` or `REDIS_PORT` in `.env.local`                |
| Auth / cookies fail       | Check `WEB_ORIGIN`, `ADMIN_ORIGIN`, `API_INTERNAL_URL`                          |
| Env / toolchain sanity    | `pnpm run env:doctor`                                                           |
| Flutter missing           | `pnpm run mobile:doctor`                                                        |
| Android can't reach API   | Ensure API is running; `AppConfig` rewrites `localhost` → `10.0.2.2` on Android |
| Stale codegen             | `make generate` then `make generate-check`                                      |
| Port conflict (apps)      | Override `*_PORT` in `.env.local`                                               |

</details>

<details>
<summary><strong>Production checklist</strong></summary>

- Replace JWT secrets, seed credentials, MFA encryption key, CSRF secret
- Set `APP_ENV=production`, `COOKIE_SECURE=true`, HTTPS origins
- Disable or protect Swagger in production
- Leave `DATABASE_SKIP_RLS_CHECK` unset/false (refused when deployed)
- Do not run `db:seed` / `db:reset` in prod without `ALLOW_PROD_SEED=1` / `ALLOW_PROD_RESET=1`
- Inject secrets from your orchestrator — never commit them
- Keep generated clients in sync (`pnpm run generate:check` in CI)
- Confirm CI required checks include quality, contracts, API e2e, and mobile

</details>

<details>
<summary><strong>Firebase push (optional)</strong></summary>

Firebase is for **mobile FCM only**. Without it, inbox still works.

Add `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` to `.env.local` and platform config in the Flutter app.

→ [apps/mobile/README.md](apps/mobile/README.md)

</details>

<details>
<summary><strong>Agent browser control</strong></summary>

Live-browser control for agents comes from ZCode's `browser-use` plugin
(`control-browser`, `web-gui-tester`), not from a package in this repo.

There is **no browser-control / extension harness in this repo**: no
`playwright-extension-live-browser` skill and no `browser-control:*` or
`extension:*` npm scripts exist here, so don't go looking for them. The former
`browser-control:plan` / `extension:plan` and `browser-control:session:reset` /
`extension:session:reset` entries pointed at
`.agents/skills/playwright-extension-live-browser/scripts/*.mjs`, a skill that
ships with the kit and is not committed here, so the scripts could never run and
were removed.

</details>

<br />

<p align="center">
  <sub>MIT License · Built with NestJS, Next.js, Flutter, and Turborepo</sub>
</p>

<a id="license"></a>
