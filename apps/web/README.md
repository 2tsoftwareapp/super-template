# web

Next.js public landing and auth-facing pages (port 3000). Marketing only —
product flows live in `apps/admin`.

- Server env is validated in `src/core/config`; `NEXT_PUBLIC_*` values that are
  unset must not fall back to localhost in a production build.
- Feature folders under `src/features/<area>`; shared UI comes from `@repo/web-ui`.

Commands: `pnpm --filter web dev|test|typecheck`, e2e in `apps/web/e2e`.
