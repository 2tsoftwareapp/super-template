# Environments (dev / staging / production)

This template runs every surface — API (NestJS), Web + Admin (Next.js), and Mobile
(Flutter) — under a single environment selector: **`APP_ENV`**, one of
`development` (default), `test`, `staging`, `production`.

## Env file layering (API + Web + Admin)

All Node surfaces load env through one shared loader, `@repo/env-loader`. Files are
applied from **highest to lowest precedence** (the first source to define a key wins):

| Precedence | Source | Committed? | Purpose |
|---|---|---|---|
| 1 | real process env (shell / CI / orchestrator) | — | always wins |
| 2 | `.env.<APP_ENV>.local` | no (gitignored) | personal per-env overrides |
| 3 | `.env.local` | no (gitignored) | personal overrides, all envs (skipped when `APP_ENV=test`) |
| 4 | `.env.<APP_ENV>` | `.env.development` only | committed non-secret defaults |
| 5 | `.env` | no (gitignored) | legacy local catch-all |
| 6 | `.env.example` | yes | documented fallback / dev defaults |

`APP_ENV` itself is read **only** from the real process env (or default), never from
the cascade, to avoid a chicken-and-egg problem.

### What is committed vs secret

- **Committed:** `.env.example`, `.env.development`, `.env.staging.example`, `.env.production.example`.
- **Never committed (gitignored):** `.env`, `.env.local`, `.env.test`, `.env.staging`,
  `.env.production`, and any `.env.*.local`.
- Secrets (`[SECRET]` in the templates) come from your secret store / CI environment.

## Running each environment

```bash
# Development (default) — zero setup, uses .env.development + .env.example fallback
make dev                      # infra + API + Web + Admin
make dev-api                  # API only
make dev-web                  # Web only

# Run a backend surface as another environment locally
make dev-api APP_ENV=staging  # loads .env.staging (+ .env.staging.local) layers

# Mobile
make dev-mobile               # env/dev.json
make dev-mobile-staging       # env/staging.json
make dev-mobile-prod          # env/prod.json (release)
sh scripts/mobile.sh build appbundle   # release artifact (defaults to env/prod.json)
```

In shell scripts, source the same layering with:

```bash
APP_ENV=staging . ./scripts/load-env.sh
```

## Guard rails (enforced at API boot)

`packages/api-core/src/config/env.schema.ts` rejects unsafe deployed configs:

- **staging + production:** must not reuse the development placeholder `JWT_*` secrets
  or `MFA_ENCRYPTION_KEY`.
- **production:** `COOKIE_SECURE=true` required; `WEB_ORIGIN` and `NEXT_PUBLIC_WEB_URL`
  must be `https`; `SSO_FAKE_PROVIDER_ENABLED` must be false.

`EnvironmentService` exposes `isDevelopment`, `isStaging`, `isProduction`, `isTest`,
and `isProductionLike` (staging || production).

## Web / Admin

- `APP_ENV` (server) + `NEXT_PUBLIC_APP_ENV` (browser, inlined by Next) distinguish
  staging from production in the client bundle.
- `isSecureCookie` is `true` for every deployed env (staging + production) unless
  `COOKIE_SECURE` is set explicitly.

## Mobile

`apps/mobile/env/{dev,staging,prod}.json` feed `--dart-define-from-file`. `AppConfig`
parses `APP_ENV` into an `AppEnv` enum and exposes `isDevelopment` / `isStaging` /
`isProduction` plus `apiBaseUrl`.

## CI

CI runs with `APP_ENV=test` and injects env directly (see `.github/workflows/ci.yml`).
Deploy pipelines should inject staging/production secrets from a secret store
(e.g. GitHub Environments) rather than committing them.
