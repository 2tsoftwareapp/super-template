# apps/web — architecture conventions

These rules are enforced by ESLint boundary rules in `eslint.config.mjs`
(`web/boundary-app-router`, `web/boundary-features`, `web/boundary-ui-layer`,
`web/boundary-model-layer`, `web/boundary-core-shared`,
`web/boundary-api-no-notifications`) where possible; the rest are review
conventions. They apply to every change under `apps/web`.

## Architecture model

Organize code by **ownership first**, then by **responsibility**:

- `app/` owns the Next.js application shell and route composition.
- `features/` owns business capabilities and feature-specific knowledge.
- `shared/` owns reusable presentation/helpers that are feature-agnostic.
- `core/` owns application infrastructure and external mechanisms.

Keep code at the narrowest valid scope. A feature-specific abstraction stays in
that feature even when several files use it. Promote to `shared/` or `core/`
only after cross-feature reuse and responsibility are clear.

## Layering

```text
src/app/[locale]/**   route entries ONLY: page.tsx, layout.tsx, metadata,
                      Suspense wrappers. No business logic, no data fetching.
src/app/api/**        BFF routes (cookie/CSRF/proxy) — server-only code.
src/features/<x>/     vertical slice per feature:
  index.ts              explicit PUBLIC contract of the feature. Export only
                        capabilities other owners are allowed to consume.
  config/               static feature-owned configuration/presentation data.
                        No runtime state, React hooks, or side effects.
    <x>-config.ts
  api/                  network calls (core/http + buildPath), query hooks,
                        mutation hooks, query-key factories
    <x>.api.ts            API function calls (only file that calls webFetch)
  model/                pure domain/decision logic (no React, no HTTP, no router)
    <x>.types.ts          domain/view-model types that belong to feature logic
    <x>.schemas.ts        Zod schemas + inferred types
    <x>.search-params.ts  URL search-param parsing/serialization
  controllers/          orchestration hooks — compose queries/mutations,
                        manage URL state + local state, map to view props
    use-<x>-controller.ts
  screens/              route-facing feature entry (thin, calls controller)
    <x>-view.tsx
  ui/                   private presentational components — receive props only
    <x>-content.tsx
src/components/       app shell + cross-feature domain composites. UI
                      primitives do NOT live here.
src/hooks/            app-wide shared hooks (e.g. session).
src/shared/           feature-agnostic reusable presentation/helpers
                      (theme, navigation configuration, utilities).
src/core/             application infrastructure and external mechanisms:
                      auth, config, HTTP, server/BFF helpers, shared contracts.
src/i18n/             next-intl routing/messages (en, vi).
src/proxy.ts          Next 16 proxy (formerly middleware): locale negotiation.
```

**UI primitives come from `@repo/web-ui/*` — never create a local copy.** Shared
hooks come from `@repo/web-hooks/*`. The only exception is a domain-specific
composite, which lives in `src/components/` until a clearer shared ownership
emerges.

## Dependency direction

Allowed direction is toward more stable, less feature-specific boundaries:

```text
app → feature public contract → feature internals → shared/core/packages
features → shared/core/packages
shared → core/packages (when needed)
core → packages/external mechanisms
```

Never reverse the dependency:

- `core/` must not import `features/`.
- `shared/` must not import `features/`.
- one feature must not deep-import another feature's internals; use `index.ts`.
- pure feature model code must not depend on React, Next.js, HTTP, or router APIs.
- feature `config/` must not contain mutable state, hooks, API calls, or business workflows.

## Public contract rules

Treat every feature as a package:

```text
features/<x>/
  index.ts        PUBLIC
  api/            PRIVATE
  config/         PRIVATE
  controllers/    PRIVATE
  model/          PRIVATE
  screens/        PRIVATE implementation exposed selectively through index.ts
  ui/             PRIVATE
```

Rules:

- Routes and other features consume a feature through `features/<x>/index.ts`.
- Do not export internal API functions, controllers, models, or UI components
  merely because they exist.
- Export the smallest stable capability required by external consumers.
- Internal files import each other directly; they do not route through their own
  feature barrel.

## Hard rules (ESLint-enforced)

1. `src/app/**` (except `app/api/**`) must not import
   `@tanstack/react-query` or `@/core/http`.
2. `src/features/**` must not import from `src/app/**`.
3. `src/features/*/ui/**` must not call `webFetch`, React Query, router, or
   read raw session state — presentational only.
4. `src/features/*/model/**` must stay framework-free (no React, no HTTP, no
   router, no zod in UI layer).
5. `src/core/**` and `src/shared/**` must not import from business features.

## Conventions (review-enforced)

- **Naming**: files in `api/` and `model/` use dot notation (`verify-email.api.ts`,
  `verify-email.search-params.ts`). Static feature config uses
  `config/<feature>-config.ts`. Files in `controllers/`, `screens/`, `ui/`
  use kebab-case (`use-verify-email-controller.ts`, `verify-email-view.tsx`).
- **UI is presentational**: components receive data and callbacks as props.
  UI must not call `webFetch`, React Query, router, or read raw session state.
- **Controllers own orchestration**: compose queries, mutations, URL state,
  local state, and map to view props. Keep under 200 lines.
- **Route files are thin**: import the feature public contract and render the
  exported Screen/View. No deep feature imports, business logic, fetching, or forms.
- **Cross-feature imports** go through `index.ts` barrel exports only.
  No deep imports into another feature's internal files.
- **Model means domain/decision knowledge**: do not place static copy, display
  configuration, component metadata, mutable state, or infrastructure in `model/`.
- **Feature config is static**: feature-owned options/copy/configuration that are
  not domain decisions belong in `config/`; config must remain deterministic and side-effect free.
- **Pure decision, thin hook**: URL parsing and state machines are pure
  functions in `model/` with unit tests; hooks only add React wiring.
- **Core is mechanism, not business**: HTTP, auth/session infrastructure,
  runtime configuration, server/BFF helpers and cross-cutting contracts belong
  in `core/` when app-owned.
- **Shared is reusable but not infrastructure**: theme, navigation config,
  feature-agnostic presentation helpers, and stable reusable application
  helpers belong in `shared/`.
- **No dumping grounds**: do not create generic `utils`, `helpers`, `types`, or
  `services` buckets without clear ownership and responsibility.
- **i18n**: locale-aware pages live under `[locale]`; messages live in
  `src/i18n/messages/` (en, vi) and are loaded by `src/i18n/request.ts`.
- **Canonical source**: `docs/architecture/ARCHITECTURE_RULES.md` is the single
  source of truth. When this file conflicts with that document, the
  `ARCHITECTURE_RULES.md` wins.

## Verification

`pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web test`
must pass; UI-affecting changes get a browser check (web landing + the touched
route).
