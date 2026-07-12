# @repo/env-loader

Layered `.env` resolution shared by every runtime (API, Next apps, scripts, drizzle-kit).

Precedence (last wins): `.env.example` → `.env.<APP_ENV>` → `.env` → `.env.local` → real environment variables. `APP_ENV` ∈ development | test | staging | production.

Commit `.env.example` / `.env.development` / `.env.*.example`; personal secrets go in `.env.local` (gitignored). Validate with `pnpm run env:doctor`.
