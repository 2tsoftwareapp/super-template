# apps/web — architecture conventions

These rules are enforced by ESLint boundary rules in `eslint.config.mjs`
(`web/boundary-app-router`, `web/boundary-features`, `web/boundary-ui-layer`,
`web/boundary-model-layer`, `web/boundary-lib`, `web/boundary-api-no-notifications`)
where possible; the rest are review conventions. They apply to every change
under `apps/web`.

## Layering

```
src/app/[locale]/**   route entries ONLY: page.tsx, layout.tsx, metadata,
                      Suspense wrappers. No business logic, no data fetching.
src/app/api/**        BFF routes (cookie/CSRF/proxy) — server-only code.
src/features/<x>/     vertical slice per feature:
  api/                  network calls (webFetch + buildPath), query hooks,
                        mutation hooks, query-key factories
    <x>.api.ts            API function calls (only file that calls webFetch)
  model/                pure feature logic (no React, no HTTP, no router)
    <x>.types.ts          TypeScript types
    <x>.schemas.ts        Zod schemas + inferred types
    <x>.search-params.ts  URL search-param parsing/serialization
  controllers/          orchestration hooks — compose queries/mutations,
                        manage URL state + local state, map to view props
    use-<x>-controller.ts
  screens/              route-facing feature entry (thin, calls controller)
    <x>-view.tsx
  ui/                   presentational components — receive props only
    <x>-content.tsx
  index.ts              deliberate public barrel exports
src/components/       app shell + cross-feature pieces (providers). UI
                      primitives do NOT live here.
src/hooks/            app-wide shared hooks (e.g. session).
src/i18n/             next-intl routing/messages (en, vi).
src/lib/              app-specific pure helpers (http, auth, server, theme).
src/proxy.ts          Next 16 proxy (formerly middleware): locale negotiation.
```

**UI primitives come from `@repo/web-ui/*` — never create a
local copy.** Shared hooks come from `@repo/web-hooks/*`. The only exception
is a domain-specific composite, which lives in `src/components/`.

## Hard rules (ESLint-enforced)

1. `src/app/**` (except `app/api/**`) must not import
   `@tanstack/react-query` or `@/lib/http`.
2. `src/features/**` must not import from `src/app/**`.
3. `src/features/*/ui/**` must not call `webFetch`, React Query, router, or
   read raw session state — presentational only.
4. `src/features/*/model/**` must stay framework-free (no React, no HTTP, no
   router, no zod in UI layer).
5. `src/lib/**` must not import `sonner` or other client-only UI libs.

## Conventions (review-enforced)

- **Naming**: files in `api/` and `model/` use dot notation (`verify-email.api.ts`,
  `verify-email.search-params.ts`). Files in `controllers/`, `screens/`, `ui/`
  use kebab-case (`use-verify-email-controller.ts`, `verify-email-view.tsx`).
- **UI is presentational**: components receive data and callbacks as props.
  UI must not call `webFetch`, React Query, router, or read raw session state.
- **Controllers own orchestration**: compose queries, mutations, URL state,
  local state, and map to view props. Keep under 200 lines.
- **Route files are thin**: import the feature screen, render it.
  No business logic, no data fetching, no forms.
- **Cross-feature imports** go through `index.ts` barrel exports only.
  No deep imports into another feature's internal files.
- **Pure decision, thin hook**: URL parsing and state machines are pure
  functions in `model/` with unit tests; hooks only add React wiring.
- **i18n**: locale-aware pages live under `[locale]`; messages live in
  `src/i18n/messages/` (en, vi) and are loaded by `src/i18n/request.ts`.
- **Canonical source**: `docs/architecture/ARCHITECTURE_RULES.md` is the
  single source of truth. When this file conflicts with that document,
  the ARCHITECTURE_RULES.md wins.

## Verification

`pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web test`
must pass; UI-affecting changes get a browser check (web landing + the
touched route).
