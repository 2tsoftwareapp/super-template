# Next.js Shared Logic Migration Plan

## Goal

Move duplicated frontend logic out of `apps/web` and `apps/admin` into reusable workspace packages so both Next.js apps consume the same implementation through package imports instead of cross-app or relative imports.

This plan assumes:

- `apps/web` is the customer/product web app.
- `apps/admin` is the admin console being migrated from React/Vite to Next.js.
- Both apps should remain independently deployable Next.js apps.
- Shared code must live in `packages/*` and be imported as `@repo/*`.
- App route trees, page composition, app-specific navigation, and app-specific copy remain inside each app.

## Current State

The repo already uses pnpm workspaces and Turborepo:

- Apps: `apps/web`, `apps/admin`, `apps/api`
- Existing shared packages: `packages/api-contract`, `packages/tsconfig`, `packages/eslint-config`, and backend-focused packages
- Root scripts correctly delegate to `turbo run`
- `apps/web` and `apps/admin` already depend on `@repo/api-contract`
- Both apps are currently Next.js and share duplicated frontend files in `src/lib`, `src/hooks`, providers, and UI primitives

Representative duplicated or near-duplicated areas:

- `apps/web/src/lib/http.ts` and `apps/admin/src/lib/http.ts`
- `apps/web/src/lib/server/backend.ts` and `apps/admin/src/lib/server/backend.ts`
- `apps/web/src/lib/auth/cookies.ts` and `apps/admin/src/lib/auth/cookies.ts`
- `apps/web/src/lib/json.ts` and `apps/admin/src/lib/json.ts`
- `apps/web/src/lib/search-params.ts` and `apps/admin/src/lib/search-params.ts`
- `apps/web/src/lib/utils.ts` and `apps/admin/src/lib/utils.ts`
- `apps/web/src/hooks/use-session.ts` and `apps/admin/src/hooks/use-session.ts`
- `apps/web/src/components/ui/*` and `apps/admin/src/components/ui/*`
- `apps/web/src/components/providers.tsx` and `apps/admin/src/components/providers.tsx`

## Target Package Layout

Create frontend-focused packages with clear boundaries:

```text
packages/
  web-core/
    src/
      api/
      auth/
      env/
      http/
      json/
      search/
      session/
      index.ts
    package.json
    tsconfig.json
    turbo.json

  web-ui/
    src/
      components/
      hooks/
      styles/
      index.ts
    package.json
    tsconfig.json
    turbo.json

  web-test/
    src/
      setup.ts
      render.tsx
      index.ts
    package.json
    tsconfig.json
    turbo.json
```

Package responsibilities:

- `@repo/web-core`: framework-adjacent but UI-free logic shared by Next.js apps.
- `@repo/web-ui`: shared React UI primitives and client hooks that can be used by both apps.
- `@repo/web-test`: shared Vitest and Testing Library setup/helpers.

Do not put admin-only resource definitions, customer app flows, route handlers, or page components in shared packages unless both apps actually need them.

## Package Boundary Rules

Allowed dependencies:

- `apps/web` may depend on `@repo/web-core`, `@repo/web-ui`, `@repo/web-test`, and `@repo/api-contract`.
- `apps/admin` may depend on `@repo/web-core`, `@repo/web-ui`, `@repo/web-test`, and `@repo/api-contract`.
- `@repo/web-core` may depend on `@repo/api-contract`.
- `@repo/web-ui` may depend on `@repo/web-core` only when a UI component genuinely needs shared types or utilities.
- `@repo/web-test` may depend on `@repo/web-core` and `@repo/web-ui`.

Disallowed dependencies:

- Shared packages must not import from `apps/web/*` or `apps/admin/*`.
- `@repo/web-core` must not import React components.
- `@repo/web-core` must not import app aliases like `@/lib/*`.
- `@repo/web-ui` must not import app route files or app-specific navigation state.
- Apps must not import another app's source files.

Update `turbo.json` boundaries after packages are added. Add frontend tags, for example:

```json
{
  "boundaries": {
    "tags": {
      "layer:frontend-core": {
        "dependencies": {
          "allow": ["layer:frontend-core", "layer:contract", "layer:tsconfig", "layer:eslint"]
        }
      },
      "layer:frontend-ui": {
        "dependencies": {
          "allow": [
            "layer:frontend-core",
            "layer:frontend-ui",
            "layer:contract",
            "layer:tsconfig",
            "layer:eslint"
          ]
        }
      },
      "layer:frontend-test": {
        "dependencies": {
          "allow": [
            "layer:frontend-core",
            "layer:frontend-ui",
            "layer:frontend-test",
            "layer:contract",
            "layer:tsconfig",
            "layer:eslint"
          ]
        }
      }
    }
  }
}
```

Keep `layer:app` allowed to import these new frontend layers.

## Package Implementation Standards

Each new package should have package-owned scripts:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "format": "prettier --write .",
    "lint": "eslint .",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

Root scripts should continue to delegate through Turborepo only.

Each package should expose public entrypoints through `exports`:

```json
{
  "name": "@repo/web-core",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/auth/index.ts",
    "./http": "./src/http/index.ts",
    "./server": "./src/server/index.ts",
    "./session": "./src/session/index.ts"
  }
}
```

Prefer explicit subpath exports over importing internal files.

## Extraction Order

### Phase 1: Inventory and Freeze Duplicates

1. Generate a duplicate map for `apps/web/src` and `apps/admin/src`.
2. Mark each item as `shared`, `app-specific`, or `candidate but not now`.
3. Do not move route files until shared lower-level logic is extracted.
4. Add a temporary checklist issue or local notes for files that still use `@/lib/*` but should move.

Initial shared candidates:

- API envelope and API response types
- JSON primitives
- HTTP client error handling
- CSRF browser helper
- Auth cookie helpers
- BFF backend proxy helpers
- Search parameter normalization
- React Query session hook factory
- Test setup helpers
- Shared UI primitives that are visually identical

Initial app-specific candidates:

- `apps/admin/src/lib/admin-resources.ts`
- `apps/admin/src/lib/roles.ts`
- `apps/admin/src/components/admin-shell.tsx`
- `apps/admin/src/components/resource-*`
- `apps/web/src/components/app/*`
- App route files under `src/app`
- App-specific navigation definitions

### Phase 2: Extract Pure Logic to `@repo/web-core`

Move pure, non-React logic first:

- `json`
- API envelope aliases that wrap `@repo/api-contract`
- `search-params`
- generic URL/query helpers
- generic formatting helpers if both apps need them

Acceptance checks:

- No `next/*` imports in the first pure extraction batch.
- No `react` imports.
- No `@/` imports.
- Both apps typecheck after importing from `@repo/web-core`.

### Phase 3: Extract Auth and HTTP Client

Move browser-safe client HTTP logic:

- `ApiClientError`
- `webFetch`
- CSRF document-cookie lookup

Keep app-specific differences configurable:

- Session query key should be passed as an option instead of hardcoded.
- API route base path should be passed as an option if it differs later.

Suggested shape:

```ts
createWebFetch({
  getCsrfToken,
  credentials: "same-origin",
});
```

Then move Next.js server-side auth/BFF logic:

- cookie read/write helpers
- refresh-session helper
- backend proxy helper
- CSRF enforcement helper

Important: keep origin app-specific. `apps/web` should pass `env.WEB_ORIGIN`; `apps/admin` should pass `env.ADMIN_ORIGIN`.

Suggested shape:

```ts
createBffProxy({
  apiInternalUrl: env.API_INTERNAL_URL,
  allowedOrigin: env.ADMIN_ORIGIN,
});
```

Acceptance checks:

- `@repo/web-core/server` is imported only by server files or route handlers.
- Client components do not import server-only cookie helpers.
- Admin and web still send the correct CSRF origin.
- Existing auth and backend proxy tests are moved or duplicated temporarily, then consolidated.

### Phase 4: Extract React Query Session Logic

Move session query logic into `@repo/web-core/session` or `@repo/web-ui/hooks` depending on final dependency direction.

Recommended shape:

```ts
createUseSession({
  queryKey: ["admin-session"],
  sessionPath: "/api/auth/session",
  fetchJson: webFetch,
});
```

Then each app owns a tiny adapter:

```ts
export const useSession = createUseSession({
  queryKey: ["admin-session"],
  sessionPath: "/api/auth/session",
  fetchJson: webFetch,
});
```

Acceptance checks:

- Apps can keep separate query keys.
- Shared implementation owns retry behavior and response typing.
- No app-specific route constants leak into shared code unless passed as options.

### Phase 5: Extract UI Primitives to `@repo/web-ui`

Start with primitives that are identical or should be standardized:

- `button`
- `badge`
- `card`
- `input`
- `label`
- `separator`
- `skeleton`
- `spinner`
- `table`
- `tooltip`
- `empty`
- shared `cn` utility if used by UI components

Do not immediately move high-level shells:

- `admin-shell`
- `resource-page-shell`
- `resource-table`
- `web app shell`

Those may share lower-level primitives but should remain app-owned until the UX contract stabilizes.

Acceptance checks:

- `@repo/web-ui` has `"use client"` where needed.
- Tailwind class merging works from the package.
- Next.js transpiles workspace source correctly. If needed, add `transpilePackages: ["@repo/web-ui", "@repo/web-core"]` in each app's `next.config.ts`.
- `components.json` aliases are updated only if shadcn generation will target the package.

### Phase 6: Extract Providers and Test Utilities

Providers should be split into generic and app-specific layers.

Move to shared packages:

- QueryClient provider creation
- theme provider wrapper if behavior is identical
- toast provider wrapper if behavior is identical
- Vitest DOM setup
- Testing Library render helpers

Keep in apps:

- app-specific metadata
- layout files
- app-specific provider composition order if it differs
- route guards until auth requirements are identical

Acceptance checks:

- `apps/web/src/components/providers.tsx` and `apps/admin/src/components/providers.tsx` become thin app adapters.
- Tests import common setup from `@repo/web-test`.
- `pnpm --filter web test` and `pnpm --filter admin test` still work.

### Phase 7: Remove Duplicate App Code

After both apps use package imports:

1. Delete moved source files from `apps/web/src` and `apps/admin/src`.
2. Remove unused app dependencies that moved to package dependencies.
3. Keep direct dependencies in apps when app source still imports them directly.
4. Run package-cycle and boundary checks.
5. Run full verification.

## Next.js Migration Notes for Admin

The admin app should use Next.js app-router conventions instead of carrying Vite assumptions forward:

- Replace `react-router-dom` route state with Next.js route segments and `next/navigation`.
- Replace Vite env access with validated Next.js/server env modules.
- Keep route handlers under `apps/admin/src/app/api/*`.
- Keep server-only code behind server entrypoints and avoid importing it from client components.
- Keep admin route guards in app layouts or middleware-style route handlers, not in shared UI components.

If old Vite admin code still exists in a branch or sub-agent workspace, migrate in this order:

1. Move pure admin domain definitions to `apps/admin/src/lib`.
2. Replace Vite fetch/auth clients with `@repo/web-core` adapters.
3. Replace shared controls with `@repo/web-ui` primitives.
4. Convert routes to `app/(app)/*` pages.
5. Delete Vite-only bootstrap files after parity is confirmed.

## Dependency Update Checklist

For both `apps/web/package.json` and `apps/admin/package.json`:

- Add `"@repo/web-core": "workspace:*"` when Phase 2 starts.
- Add `"@repo/web-ui": "workspace:*"` when Phase 5 starts.
- Add `"@repo/web-test": "workspace:*"` when Phase 6 starts.
- Remove dependencies from apps only after no app files import them directly.

For new packages:

- Put runtime dependencies in the package that imports them.
- Put React peer dependencies in `@repo/web-ui` if components are intended to share the app's React runtime.
- Keep TypeScript, ESLint, Vitest, and Prettier as dev dependencies.
- Use existing `@repo/tsconfig` and `@repo/eslint-config`.

## Verification Commands

Run targeted checks during each phase:

```bash
pnpm --filter @repo/web-core typecheck
pnpm --filter @repo/web-core test
pnpm --filter web typecheck
pnpm --filter admin typecheck
pnpm --filter web test
pnpm --filter admin test
```

Run full checks before considering the migration complete:

```bash
pnpm run lint:policy
pnpm run typecheck
pnpm run test
pnpm run build
```

Use Turborepo affected checks in CI or large branches:

```bash
pnpm exec turbo run typecheck test build --affected
```

## Done Criteria

The migration is complete when:

- `apps/web` and `apps/admin` import shared logic only from `@repo/*` packages.
- No app imports source files from another app.
- Duplicated `http`, `json`, `auth/cookies`, `server/backend`, and `use-session` logic is removed from both apps.
- Shared UI primitives live in `@repo/web-ui` or are intentionally documented as app-specific.
- Both apps build independently.
- Turborepo boundaries pass.
- Tests cover shared package behavior and app adapters.
- The admin app has no remaining Vite-only routing, env, or bootstrap assumptions.

## Sub-Agent Work Split

Recommended parallel work streams:

- Agent A: create `@repo/web-core`, extract pure logic, auth, HTTP, and BFF proxy helpers.
- Agent B: create `@repo/web-ui`, reconcile duplicated UI primitives, and update imports.
- Agent C: create `@repo/web-test`, consolidate Vitest setup and shared render helpers.
- Agent D: finish admin Next.js route parity and remove any Vite-era code assumptions.

Merge order:

1. Agent A first, because UI and admin route work need stable shared API/auth imports.
2. Agent C second or in parallel if it only touches test setup.
3. Agent B after `@repo/web-core` exports `cn` or equivalent shared utilities.
4. Agent D last, after shared adapters are available.

