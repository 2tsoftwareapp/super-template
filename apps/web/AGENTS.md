# apps/web — architecture conventions

These rules are enforced by ESLint boundary rules in `eslint.config.mjs` where possible; the rest are review conventions. They apply to every change under `apps/web`.

## Architecture model

Organize code by **ownership first**, then by **responsibility**:

- `app/` owns the Next.js application shell and route composition.
- `features/` owns business capabilities and feature-specific knowledge.
- `shared/` owns reusable presentation/helpers that are feature-agnostic.
- `core/` owns application infrastructure and external mechanisms.

Keep code at the narrowest valid scope. Promote to `shared/` or `core/` only after cross-feature reuse and responsibility are clear.

A layer is **optional**. Do not create `model/`, `state/`, `api/`, or any other folder only to satisfy a template. Create a boundary only when the feature actually has that responsibility.

## Feature responsibility map

```text
src/features/<x>/
  index.ts              PUBLIC contract only

  config/               static feature-owned configuration and copy
    <x>-config.ts

  api/                  integration boundary: BFF/API calls, query/mutation adapters
    <x>.api.ts
    <x>.queries.ts
    <x>.mutations.ts
    <x>.query-keys.ts

  model/                OPTIONAL pure domain/decision knowledge only
    <x>.rules.ts
    <x>.schemas.ts       only when the schema represents domain/business input
    <x>.types.ts         domain types only

  controllers/          application orchestration + presentation contract
    use-<x>-controller.ts
    <x>-view-model.ts
    <x>-search-params.ts
    <x>-error.ts

  state/                OPTIONAL feature state when state outlives a component/controller

  screens/              route-facing feature composition
    <x>-view.tsx

  ui/                   private presentational components; props in, events out
    <x>-content.tsx
```

### Responsibility tests

Before choosing a folder, ask:

- **Is it a business/domain decision that remains meaningful without React/Next/API?** → `model/`.
- **Is it orchestration, URL input adaptation, view state, error-to-copy mapping, or a screen contract?** → `controllers/`.
- **Is it static feature-owned data/copy/options?** → `config/`.
- **Does it communicate with the backend/external system?** → `api/`.
- **Does it only render and emit user events?** → `ui/`.
- **Is it the route-facing composition point?** → `screens/`.

If none applies, reconsider whether the abstraction should exist.

## Public contract boundary

Treat every feature as a package:

```text
features/<x>/
  index.ts        PUBLIC
  everything else PRIVATE by default
```

Rules:

- Routes and other features consume a feature through `features/<x>/index.ts`.
- Export the smallest stable capability required by external consumers.
- Do not export API functions, controllers, internal models, config, or UI components merely because they exist.
- Internal files import each other directly; they do not route through their own feature barrel.
- Cross-feature deep imports are architecture violations.

## Dependency direction

Allowed direction is toward more stable, less feature-specific boundaries:

```text
app → feature public contract
feature screens/ui → controllers
controllers → model/api/config/core/shared/packages
api → core/packages
model → runtime-agnostic packages only
shared → core/packages (when needed)
core → packages/external mechanisms
```

Never reverse the dependency:

- `core/` must not import `features/`.
- `shared/` must not import `features/`.
- `model/` must not import React, Next.js, router APIs, HTTP clients, feature API, controllers, screens, or UI.
- `ui/` must not fetch data or own application workflows.
- one feature must not deep-import another feature's internals.

## Layer rules

### Route / app

Route files are composition entries only. They may resolve Next.js route props and render a feature public entry. They do not own business logic, API calls, forms, or feature state.

### Screens

Screens connect a controller/view-model to presentational UI. They may handle top-level loading/error boundaries and simple layout composition, but not business decisions or data fetching.

### Controllers = application layer

Controllers own user-flow orchestration:

- React lifecycle and local interaction state;
- URL/search-param adaptation;
- query/mutation composition;
- side-effect scheduling and cleanup;
- mapping infrastructure failures to safe presentation outcomes;
- producing the view model consumed by the screen/UI.

Keep pure helpers next to the controller when they exist only to support that application flow (`<x>-search-params.ts`, `<x>-error.ts`, `<x>-view-model.ts`). Do **not** misclassify them as domain model code.

### Model = domain/decision layer

`model/` exists only when the feature has framework-independent business knowledge: rules, policies, calculations, state transitions, or domain schemas/types.

Do not put these in `model/`:

- view models;
- URL/search-param adapters;
- static marketing/UI copy;
- React state;
- navigation decisions tied to Next.js;
- API DTO plumbing;
- infrastructure errors.

If a feature has no domain decision logic, it may have **no `model/` folder at all**.

### Config

`config/` contains deterministic feature-owned static values: feature copy, options, thresholds, URLs derived from environment, delays, or presentation metadata. It must not contain mutable state, hooks, API calls, or workflows.

### API

`api/` isolates external communication. Raw HTTP calls live here; controllers consume API/query adapters rather than calling `fetch`/`webFetch` directly.

### UI

`ui/` is presentational. Components receive data and callbacks as props and must not know how application workflows, routing, HTTP, or server state are implemented.

### State

Create `state/` only when state needs a lifecycle broader than a component/controller or is intentionally shared inside the feature. Do not promote ephemeral dialog/tab/form state into a store without a lifecycle reason.

## Side-effect rule

Keep decision logic pure where practical and isolate side effects at explicit boundaries:

```text
pure decisions / parsing / mapping
          ↓
application orchestration
          ↓
HTTP / navigation / timers / storage / logging
```

Every scheduled side effect must have lifecycle cleanup when applicable (timers, subscriptions, listeners, in-flight work guards).

## Testing boundaries

Tests follow responsibility, not just file type:

- pure domain/decision tests colocate with `model/`;
- controller/application tests cover orchestration, lifecycle, state, and failure mapping;
- API tests cover request contract and HTTP behavior;
- UI tests cover rendering and user events;
- feature tests prove the capability as a whole;
- application E2E tests live outside the feature when the journey crosses feature boundaries.

A refactor that moves responsibility should move its tests with it.

## Shared and core

- `shared/` is reusable but not infrastructure: theme, navigation config, feature-agnostic presentation helpers, stable reusable application helpers.
- `core/` is mechanism, not business: HTTP, auth/session infrastructure, runtime configuration, server/BFF helpers, errors/observability, cross-cutting contracts.
- Reuse alone does not make something `core`.
- Do not create generic `utils`, `helpers`, `types`, or `services` dumping grounds without clear ownership.

## Naming

- `api/`: dot notation for transport concerns (`verify-email.api.ts`).
- `config/`: `<feature>-config.ts`.
- `model/`: responsibility suffixes such as `.rules.ts`, `.schemas.ts`, `.types.ts`.
- `controllers/`, `screens/`, `ui/`: kebab-case.
- names must describe responsibility, not implementation vagueness.

## Verification

At minimum:

```text
pnpm --filter web format:check
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build
```

UI-affecting changes also require a browser check for the touched route.

The architectural goal is **predictability**: a developer or AI agent should be able to determine where code belongs, what it may depend on, and which tests prove it without guessing.

`docs/architecture/ARCHITECTURE_RULES.md` remains the repository-level canonical source; when architecture changes materially, update both documents in the same change set.
