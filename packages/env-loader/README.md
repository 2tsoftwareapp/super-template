# @repo/env-loader

Layered `.env` resolution shared by every runtime (API, Next apps, scripts,
drizzle-kit).

dotenv never overrides a key that is already set, so the **first file to define
a key wins**. Files are applied from highest to lowest precedence:

1. real process env (already set — always wins)
2. `.env.<APP_ENV>.local` — personal per-env overrides (gitignored)
3. `.env.local` — personal overrides (dev only; skipped outside `APP_ENV=development`)
4. `.env.<APP_ENV>` — committed non-secret defaults
5. `.env` — legacy local catch-all (gitignored)
6. `.env.example` — documented fallback

`APP_ENV` ∈ `development` | `test` | `staging` | `production`. It is resolved
from the real process env (or an explicit override), never from the file cascade.

Commit `.env.example` / `.env.development` / `.env.*.example`; personal secrets
go in `.env.local` (gitignored). Validate with `pnpm run env:doctor`.
