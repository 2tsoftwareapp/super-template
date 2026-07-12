# @repo/web-core

Shared web foundation for `apps/web` and `apps/admin`: the design system + BFF/auth plumbing. **Single source of truth for UI primitives** — apps never keep local copies.

## Entry points

| Import | Contents | Side |
|---|---|---|
| `@repo/web-core` | Named client-safe surface: `webFetch`/`ApiClientError`, `cn`, storage, session hook factory, JSON utils, hooks | client |
| `@repo/web-core/components/*` | UI primitives (button, card, table, dialog, calendar, …) | client |
| `@repo/web-core/server` | `createBackendHelpers`: BFF proxy with 401→refresh (single-flight per token), origin/CSRF guards | **server-only** |
| `@repo/web-core/auth/cookies` | HttpOnly token cookies + HMAC-signed CSRF (double-submit) | **server-only** |
| `@repo/web-core/api-types`, `/search-params`, `/http`, … | focused subpaths | mixed |

Server entries import `server-only` — pulling them into a Client Component fails the build by design (tests alias it to a stub, see `vitest.config.ts`).

## Rules

- Both apps must keep `@source "../../../../packages/web-core/src"` in `globals.css` or Tailwind silently drops these classes (CLAUDE.md hazard).
- New primitives come with a render test in `components.smoke.test.tsx`.
