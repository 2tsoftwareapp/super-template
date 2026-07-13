# apps/admin — architecture conventions

These rules are enforced by ESLint boundary rules in `eslint.config.mjs`
(`admin/boundary-app-router`, `admin/boundary-features`) where possible; the
rest are review conventions. They apply to every change under `apps/admin`.

## Layering

```
src/app/**            route entries ONLY: page.tsx, layout.tsx, metadata,
                      Suspense wrappers. No business logic, no data fetching.
src/app/api/**        BFF routes (cookie/CSRF/proxy) — server-only code.
src/features/<x>/     vertical slice per feature:
  api/                  network calls (webFetch + buildPath), query hooks,
                        mutation hooks, query-key factories
    <x>.api.ts            API function calls (only file that calls webFetch)
    <x>.query-keys.ts     query-key factory object
    <x>.queries.ts        useQuery hooks
    <x>.mutations.ts      useMutation hooks
  model/                pure feature logic (no React, no HTTP, no router)
    <x>.types.ts          TypeScript types
    <x>.schemas.ts        Zod schemas + inferred types
    <x>.search-params.ts  URL search-param parsing/serialization
    <x>.sorting.ts        sort helpers
    <x>.permissions.ts    permission selectors from session
    <x>.constants.ts      constants
  controllers/          orchestration hooks — compose queries/mutations,
                        manage URL state + local state, map to view props
    use-<x>-controller.ts
  screens/              route-facing feature entry (thin, calls controller)
    <x>-list-screen.tsx
    <x>-detail-screen.tsx
  ui/                   presentational components — receive props only
    <x>-list-view.tsx
    <x>-table.tsx
    <x>-toolbar.tsx
  index.ts              deliberate public barrel exports
src/components/       app shell + cross-resource pieces (AdminShell, guards,
                      resource-table/toolbar). UI primitives do NOT live here.
src/lib/              app-specific pure helpers (paths, formatting, RBAC maps)
src/proxy.ts          Next 16 proxy (formerly middleware): cookie pre-filter
```

**UI primitives come from `@repo/web-ui/*` — never create a
local copy.** Shared hooks come from `@repo/web-hooks/*`. The only exception
is a domain-specific composite (e.g.
`permission-multi-select`), which lives in `src/components/`.

## Hard rules (ESLint-enforced)

1. `src/app/**` (except `app/api/**`) must not import
   `@tanstack/react-query` or `@/lib/http`.
2. `src/features/**` must not import from `src/app/**`.

## Conventions (review-enforced)

- **Naming**: files in `api/` and `model/` use dot notation (`users.api.ts`,
  `users.schemas.ts`). Files in `controllers/`, `screens/`, `ui/` use kebab-case
  (`use-users-list-controller.ts`, `users-list-screen.tsx`).
- **Query keys** use a factory pattern (`usersKeys.all`, `usersKeys.list(params)`)
  and live in `api/<x>.query-keys.ts`. Mutations import the factory for
  invalidation — never retype the key literal.
- **Mutation hook signatures** follow scope:
  - id fixed by the route (`/users/[id]` detail page) → hook argument:
    `useUpdateProfileMutation(userId, options?)`. Stable for the page's life,
    no stale-closure risk.
  - id varies per row/target (list pages, drawers) → `.mutate(payload)`:
    `deleteRole.mutate(roleId)`, `saveRole.mutate({ roleId, input })`.
- **UI is presentational**: components receive data and callbacks as props.
  UI must not call `webFetch`, React Query, router, or read raw session state.
- **Controllers own orchestration**: compose queries, mutations, URL state,
  local state, permissions, and map to view props. Keep under 200 lines;
  split by concern when exceeding.
- **Route files are thin**: import the screen component, render it.
  No business logic, no data fetching, no forms.
- **Cross-feature imports** go through `index.ts` barrel exports only.
  No deep imports into another feature's internal files.
- **Pure decision, thin hook**: state machines (guards, proxies) are pure
  functions (`admin-guard-state.ts`, `lib/auth/proxy-auth.ts`) with unit
  tests; hooks only add React wiring.
- **Session access** inside the gated tree goes through `useAdminSession()`
  (from `components/admin-guard.tsx`) — not raw `useSession()` — so the
  non-null session invariant holds.
- **Canonical source**: `docs/architecture/ARCHITECTURE_RULES.md` is the
  single source of truth. When this file conflicts with that document,
  the ARCHITECTURE_RULES.md wins.

## Verification

`pnpm --filter admin lint && pnpm --filter admin typecheck && pnpm --filter admin test`
must pass; UI-affecting changes get a browser check (login → dashboard →
the touched resource).
