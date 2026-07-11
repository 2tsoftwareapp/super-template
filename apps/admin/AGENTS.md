# apps/admin — architecture conventions

These rules are enforced by ESLint boundary rules in `eslint.config.mjs`
(`admin/boundary-app-router`, `admin/boundary-features`) where possible; the
rest are review conventions. They apply to every change under `apps/admin`.

## Layering

```
src/app/**            route entries ONLY: page.tsx, layout.tsx, metadata,
                      Suspense wrappers. No business logic, no data fetching.
src/app/api/**        BFF routes (cookie/CSRF/proxy) — server-only code.
src/features/<x>/     everything the resource does:
  <x>-service.ts        network calls (webFetch + buildPath), plain functions
  use-<x>-queries.ts    useQuery hooks + exported *_QUERY_KEY constants
  use-<x>-mutations.ts  useMutation hooks (invalidation + toasts live here)
  <x>-schemas.ts        zod schemas + inferred types
  components/           the resource's views, drawers, table columns, atoms
src/components/       app shell + cross-resource pieces (AdminShell, guards,
                      resource-table/toolbar). UI primitives do NOT live here.
src/lib/              app-specific pure helpers (paths, formatting, RBAC maps)
src/proxy.ts          Next 16 proxy (formerly middleware): cookie pre-filter
```

**UI primitives come from `@repo/web-core/components/*` — never create a
local copy.** The only exception is a domain-specific composite (e.g.
`permission-multi-select`), which lives in `src/components/`.

## Hard rules (ESLint-enforced)

1. `src/app/**` (except `app/api/**`) must not import
   `@tanstack/react-query` or `@/lib/http`.
2. `src/features/**` must not import from `src/app/**`.

## Conventions (review-enforced)

- **Query keys** are exported `*_QUERY_KEY` constants, defined next to the
  query that owns them. Mutations import the constant for invalidation —
  never retype the string. Cross-feature invalidation imports the other
  feature's constant.
- **Mutation hook signatures** follow scope:
  - id fixed by the route (`/users/[id]` detail page) → hook argument:
    `useUpdateProfileMutation(userId, options?)`. Stable for the page's life,
    no stale-closure risk.
  - id varies per row/target (list pages, drawers) → `.mutate(payload)`:
    `deleteRole.mutate(roleId)`, `saveRole.mutate({ roleId, input })`.
- **Views are presentational**: a `*-view.tsx` reads hooks, wires callbacks,
  renders. Fetch logic, URL building, and schema validation belong to the
  feature's service/schema files.
- **Pure decision, thin hook**: state machines (guards, proxies) are pure
  functions (`admin-guard-state.ts`, `lib/auth/proxy-auth.ts`) with unit
  tests; hooks only add React wiring.
- **Session access** inside the gated tree goes through `useAdminSession()`
  (from `components/admin-guard.tsx`) — not raw `useSession()` — so the
  non-null session invariant holds.

## Verification

`pnpm --filter admin lint && pnpm --filter admin typecheck && pnpm --filter admin test`
must pass; UI-affecting changes get a browser check (login → dashboard →
the touched resource).
