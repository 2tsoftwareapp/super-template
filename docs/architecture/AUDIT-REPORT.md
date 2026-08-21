# 🔍 Architecture & UI Audit Report

> **Date:** 2026-08-20
> **Scope:** Full monorepo audit — FE (admin, web), BE (api, api-identity, api-platform), shared packages
> **Goal:** Find the cleanest, highest-quality, most reusable architecture & UI design

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. What's Already Great](#2-whats-already-great)
- [3. Frontend Audit](#3-frontend-audit)
  - [3.1 Layer Boundaries](#31-layer-boundaries--excellent)
  - [3.2 Naming Convention Drift](#32-naming-convention-drift)
  - [3.3 Controller Size & Responsibility](#33-controller-size--responsibility)
  - [3.4 Ghost Package: @repo/web-core](#34-ghost-package-repo-web-core)
  - [3.5 Shared Components Locked in Admin](#35-shared-components-locked-in-admin)
  - [3.6 Duplicated Patterns](#36-duplicated-patterns)
  - [3.7 Resource Config Inconsistencies](#37-resource-config-inconsistencies)
- [4. Backend Audit](#4-backend-audit)
  - [4.1 Clean Architecture Compliance](#41-clean-architecture-compliance)
  - [4.2 Mapper Placement](#42-mapper-placement)
- [5. Documentation Fragmentation](#5-documentation-fragmentation)
- [6. Redesign Plan — Architecture + UI](#6-redesign-plan--architecture--ui)
  - [6.1 Shared Package Restructure](#61-phase-1-shared-package-restructure)
  - [6.2 Extract Reusable Hooks](#62-phase-2-extract-reusable-hooks)
  - [6.3 Controller Cleanup](#63-phase-3-controller-cleanup)
  - [6.4 UI Component Improvements](#64-phase-4-ui-component-improvements)
  - [6.5 Doc Consolidation](#65-phase-5-doc-consolidation)
- [7. Migration Priority](#7-migration-priority)
- [8. Proposed New Layout](#8-proposed-new-layout)

---

## 1. Executive Summary

**Monorepo Turborepo + pnpm, 4 apps (web, admin, api, mobile), ~20 shared packages.**

| Area | Grade | Notes |
|------|-------|-------|
| **BE Architecture** | 🟢 A | Clean Architecture, proper bounded contexts, good DI |
| **FE Layer Boundaries** | 🟢 A | Strict, well-enforced via ESLint + conventions |
| **FE Feature Structure** | 🟢 A- | Vertical-slice consistent, but naming drift |
| **Shared Packages** | 🟡 B | web-ui good, but lots of reusable code trapped in admin app |
| **Code Reuse** | 🟡 B- | Significant duplication across controllers and HTTP setup |
| **Documentation** | 🟡 B- | 8+ locations with potentially conflicting instructions |
| **Naming Conventions** | 🟡 C+ | New conventions defined but not adopted anywhere |

**Core finding:** The architecture foundation is strong. The main problems are:
1. **Trapped reuse** — shared components/hooks stuck inside admin app
2. **Duplicated patterns** — 6+ controllers copy-paste the same debounce+URL sync code
3. **Ghost references** — `@repo/web-core` referenced everywhere but has no code
4. **Doc drift** — multiple sources of truth confuse AI agents

---

## 2. What's Already Great

These strengths should be **preserved and protected** in any redesign:

| # | Strength | Evidence |
|---|----------|----------|
| 1 | **BE Clean Architecture** | Controller → UseCase → Domain → Port → Infrastructure, strictly followed in api-identity and api-platform |
| 2 | **Bounded Contexts** | api-identity (auth, users, orgs, RBAC, MFA, SSO) and api-platform (settings, mail, files, jobs, etc.) are well-separated |
| 3 | **FE Layer Boundaries** | UI components never import `useQuery`/`useMutation`/`webFetch`/`useRouter`/`useSearchParams` — verified via code search |
| 4 | **Feature-Sliced Structure** | Every admin feature follows: `api/` → `model/` → `controllers/` → `screens/` → `ui/` |
| 5 | **36 UI Primitives** | `@repo/web-ui` has comprehensive design system (button, table, dialog, sheet, combobox, etc.) |
| 6 | **Query Key Factories** | Every feature uses `xxxKeys.all()` / `xxxKeys.list(params)` pattern |
| 7 | **Pure Permission Selectors** | `selectXxxPermissions()` functions in model layer — no hooks, no side effects |
| 8 | **Search Param Typing** | `parseXxxSearchParams()` / `serializeXxxSearchParams()` pattern with type safety |
| 9 | **Generated API Contract** | OpenAPI → TypeScript + Dart clients via `pnpm generate` |
| 10 | **Route Pages as Thin Wrappers** | `page.tsx` only renders `<Suspense><XxxView /></Suspense>` — no business logic |

---

## 3. Frontend Audit

### 3.1 Layer Boundaries — Excellent ✅

Verified by searching across all admin features:

| Violation Type | Matches Found |
|----------------|---------------|
| `useQuery`/`useMutation` in `ui/` | **0** ✅ |
| `webFetch` in `ui/` | **0** ✅ |
| `useRouter`/`useSearchParams` in `ui/` | **0** ✅ |
| `useSession`/`useAdminSession` in `ui/` | **0** ✅ |
| `toast` in `api/` | **0** ✅ |
| `@repo/web-ui` imports in `controllers/` | **0** ✅ |
| `../ui/` deep imports in `controllers/` | **0** ✅ |
| `@tanstack/react-query` or `@/lib/http` in `ui/` | **0** ✅ |

**This is genuinely impressive — the boundary enforcement is working perfectly.**

### 3.2 Naming Convention Drift

CODING_RULES defines new conventions, but **zero features** have adopted them:

| Item | CODING_RULES Says | Actual Codebase |
|------|-------------------|-----------------|
| Controller file name | `use<Feature>Handlers.ts` | All 14 features use `use-*-controller.ts` |
| Controller export name | `use<Feature>Handlers` | All export `useXxxController` |
| Handler function naming | `handle<Action>` | Mixed: `handleXxx`, `onXxx`, direct callbacks |

**All 14 features with controllers:**

| Feature | Controller File | Lines |
|---------|----------------|-------|
| users | `use-users-list-controller.ts` | ~230 ⚠️ |
| users (detail) | `use-user-detail-controller.ts` | ~150 |
| roles | `use-roles-controller.ts` | ~80 |
| organizations | `use-organizations-controller.ts` | ~70 |
| settings | `use-settings-controller.ts` | ~115 |
| audit-logs | `use-audit-logs-controller.ts` | ~130 |
| notifications | `use-notifications-controller.ts` | ~120 |
| jobs | `use-jobs-controller.ts` | ~130 |
| files | `use-files-controller.ts` | ~120 |
| mail | `use-mail-controller.ts` | ~130 |
| imports | `use-imports-controller.ts` | ~70 |
| dashboard | `use-dashboard-controller.ts` | ~90 |
| security | `use-security-controller.ts` | ~50 |
| auth | `use-admin-login-flow.ts` | ~120 |

### 3.3 Controller Size & Responsibility

**`use-users-list-controller.ts` (~230 lines)** is the worst offender. It contains:

1. URL search param parsing
2. Search input state + debounce sync
3. List query (React Query)
4. Session + permissions
5. Activate/block/resend mutations
6. Bulk action orchestration
7. Confirm dialog state
8. Create drawer state + controller
9. Table sort bridge config
10. Resource table config (TanStack)
11. Row click navigation
12. Status filter handler
13. 20+ return properties

**DESIGN.md warns: >200 lines = must decompose.**

A cleaner approach:

```
use-users-list-controller.ts  (composes sub-hooks, < 60 lines)
├── use-debounced-url-search.ts   (search + URL sync)
├── use-users-bulk-actions.ts     (already extracted ✅)
├── use-users-confirm-block.ts    (already extracted ✅)
├── use-create-user-drawer.ts     (already extracted ✅)
└── use-resource-table-config.ts  (shared, already extracted ✅)
```

### 3.4 Ghost Package: `@repo/web-core`

Referenced in **14 locations** across docs:

| Document | What it says |
|----------|-------------|
| `CLAUDE.md` | "UI primitives come only from `@repo/web-core/components/*`" |
| `CODING_RULES.md` | "Shared primitive chỉ lấy từ `web-core`" |
| `README.md` | "`@repo/web-core` shared web UI + logic" |
| `docs/architecture.md` | "`@repo/web-core/components/*` is the single source of UI" |
| 4+ architecture specs | Various references |

**Reality:** `packages/web-core/` directory contains **only** `node_modules/` and `.turbo/`. Zero source files. Zero `package.json`. It's completely empty.

**Actual shared UI:** Lives in `@repo/web-ui` (36 components) — the package nobody references in docs.

**Impact:** AI agents read docs → try to import from `@repo/web-core` → import fails or silently resolves to nothing.

### 3.5 Shared Components Locked in Admin

These components in `apps/admin/src/components/` are **generic by nature** but cannot be used by the web app or any future app:

| Component | Used By | Why It's Generic |
|-----------|---------|------------------|
| `resource-table.tsx` | All admin list features | Generic TanStack Table renderer with skeleton/loading/error/empty states |
| `resource-page-shell.tsx` | All admin list pages | Page layout with icon, title, description, actions |
| `resource-toolbar.tsx` | All admin list features | Search input + filter slots + clear button |
| `resource-drawer.tsx` | All admin drawer features | Slide-over panel with backdrop, header, body, footer |
| `bulk-action-bar.tsx` | All admin bulk ops | Animated bar showing selection count + actions |
| `use-resource-table-config.ts` | All admin list features | TanStack Table setup with sort bridge + row selection |
| `permission-multi-select.tsx` | roles, organizations | Generic permission picker |

**Total: ~800 lines of reusable code trapped in admin app.**

### 3.6 Duplicated Patterns

#### 6.6.1 Animation Boilerplate (ResourceDrawer + BulkActionBar)

Both components implement identical mount/unmount animation:

```tsx
// IDENTICAL in both resource-drawer.tsx and bulk-action-bar.tsx
const [visible, setVisible] = useState(false);
const [animate, setAnimate] = useState(false);

useEffect(() => {
  if (open) {
    setVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimate(true));
    });
  } else {
    setAnimate(false);
    const timer = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(timer);
  }
}, [open]);
```

**Fix:** Extract `useAnimatePresence(isOpen: boolean)` hook → saves ~20 lines per component.

#### 6.6.2 Debounce + URL Sync (6 Controllers)

At least 6 controllers implement the same pattern:

```tsx
// IDENTICAL pattern in: users, settings, audit-logs, jobs, mail, files
const [searchInput, setSearchInput] = useState(urlSearch);
const debouncedSearch = useDebouncedValue(searchInput, 300);

// Sync URL → local state
useEffect(() => {
  if (lastUrlSearchRef.current === urlSearch) return;
  lastUrlSearchRef.current = urlSearch;
  syncingFromUrlRef.current = true;
  setSearchInput(urlSearch);
}, [urlSearch]);

// Sync local state → URL (debounced)
useEffect(() => {
  if (syncingFromUrlRef.current) { /* ... */ return; }
  // ... URL update logic
}, [debouncedSearch, ...]);
```

**Fix:** Extract `useDebouncedUrlSearch({ defaults, debounceMs })` → saves ~50 lines per controller.

#### 6.6.3 HTTP Client Setup

Both apps have near-identical `lib/http.ts`:

```ts
// apps/admin/src/lib/http.ts
import { configureHttpClient } from "@repo/web-utils/http-config";
import { CSRF_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
configureHttpClient({ csrfCookieName: CSRF_TOKEN_COOKIE });
export { ApiClientError, webFetch, webFetchBlob } from "@repo/web-utils/http";
export function buildPath(...) { /* identical */ }

// apps/web/src/lib/http.ts (same pattern)
import { configureHttpClient } from "@repo/web-utils/http-config";
import { CSRF_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
configureHttpClient({ csrfCookieName: CSRF_TOKEN_COOKIE });
export { ApiClientError, webFetch } from "@repo/web-utils/http";
```

**Fix:** Create `@repo/web-bff` package → single source of HTTP client setup.

#### 6.6.4 Utils Re-exports

Both apps have identical `lib/utils.ts`:
```ts
export { cn, getCsrfTokenFromDocument } from "@repo/web-utils";
```

### 3.7 Resource Config Inconsistencies

| Feature | Resource Config Source | Issue |
|---------|----------------------|-------|
| users, roles, orgs, etc. | `adminResources.find(r => r.id === "users")!` | ✅ Standard |
| security | Defined inline in `security-view.tsx` | ⚠️ Not in adminResources |
| dashboard | In adminResources but no sidebar entry | ⚠️ Missing navigation |

---

## 4. Backend Audit

### 4.1 Clean Architecture Compliance

**Backend is in excellent shape.** Every bounded context module follows:

```
modules/<domain>/
├── <domain>.module.ts          # NestJS DI wiring
├── presentation/               # Controllers, DTOs, mappers
├── application/
│   ├── use-cases/              # Business orchestration
│   ├── ports/                  # Interface contracts + injection tokens
│   ├── services/               # Cross-use-case services (rare)
│   ├── models/                 # Application-layer data types
│   └── errors/                 # Domain-specific error codes
├── domain/                     # Pure business rules (optional, only when needed)
└── infrastructure/             # Drizzle repos, external service adapters
```

**Verified modules:**

| Bounded Context | Modules | Architecture |
|----------------|---------|-------------|
| api-identity | auth, users, organizations, access-control, mfa, sso, preferences | ✅ Clean |
| api-platform | settings, mail, imports, storage, exports, audit, files, activities, jobs, notifications | ✅ Clean |

**Key patterns followed:**
- Controllers inject UseCases directly (no unnecessary facade layers) ✅
- Ports are TypeScript interfaces with injection tokens ✅
- Domain has zero framework dependencies ✅
- Infrastructure implements Port interfaces ✅
- DI binding at module level with `useExisting` ✅

**`AuthService` is a clean exception** — it's a cross-module facade for the auth guard, not a pass-through. Only one method (`authenticateAccessToken`), called by `apps/api/src/shell/`.

### 4.2 Mapper Placement

`auth.mapper.ts` and `users.mapper.ts` sit in `application/`:

```
application/
├── auth.mapper.ts        ← should be in presentation/mappers/ or infrastructure/
├── users.mapper.ts       ← same
```

Per DESIGN.md, mappers should be:
- **Presentation mappers** (application result → response DTO) → `presentation/mappers/`
- **Persistence mappers** (domain model ↔ DB record) → `infrastructure/persistence/`

**Impact:** Low — current placement works, but inconsistent with the recommended structure.

---

## 5. Documentation Fragmentation

**8+ locations** contain architecture instructions that could conflict:

| # | File | Scope | Authority Level |
|---|------|-------|-----------------|
| 1 | `CLAUDE.md` | AI agent guidance | High |
| 2 | `AGENTS.md` | Agent workflow | High |
| 3 | `CODING_RULES.md` | Detailed coding rules | **Highest** |
| 4 | `DESIGN.md` | Architecture design decisions | High |
| 5 | `apps/admin/AGENTS.md` | Admin-specific conventions | Medium |
| 6 | `apps/web/AGENTS.md` | Web-specific conventions | Medium |
| 7 | `docs/architecture/ARCHITECTURE_RULES.md` | Architecture rules | Medium |
| 8 | `.agents/skills/*/SKILL.md` | Skill-specific instructions | Low |

**Concrete conflict example:** `CLAUDE.md` says import from `@repo/web-core/components/*`, but actual code uses `@repo/web-ui/button`, `@repo/web-ui/table`, etc.

**Recommendation:** Single canonical source → all others link to it.

---

## 6. Redesign Plan — Architecture + UI

### Phase 1: Shared Package Restructure

**Goal:** Unlock reuse across admin, web, and future apps.

#### 1a. Expand `@repo/web-ui` with hooks + composables

```
packages/web-ui/src/
├── components/           # ✅ Existing 36 UI primitives (keep as-is)
├── hooks/                # 🆕 Shared React hooks
│   ├── use-animate-presence.ts
│   ├── use-debounced-url-search.ts
│   ├── use-media-query.ts
│   └── index.ts
├── composables/          # 🆕 Complex shared UI patterns
│   ├── resource-shell.tsx        # From admin/components/resource-page-shell.tsx
│   ├── resource-toolbar.tsx      # From admin/components/resource-toolbar.tsx
│   ├── resource-table.tsx        # From admin/components/resource-table.tsx
│   ├── resource-drawer.tsx       # From admin/components/resource-drawer.tsx
│   ├── bulk-action-bar.tsx       # From admin/components/bulk-action-bar.tsx
│   └── index.ts
└── types/                # 🆕 Shared UI types
    └── table.ts
```

**New exports in `package.json`:**
```json
{
  "./hooks": "./src/hooks/index.ts",
  "./composables": "./src/composables/index.ts"
}
```

#### 1b. Create `@repo/web-bff` Package

```
packages/web-bff/
├── src/
│   ├── http.ts           # configureHttpClient + webFetch re-export
│   ├── build-path.ts     # Shared buildPath utility
│   ├── cookie-names.ts   # CSRF token cookie constant
│   └── index.ts
├── package.json
└── tsconfig.json
```

Both apps simplify to:
```ts
import { webFetch, buildPath, configureCsrf } from "@repo/web-bff";
```

#### 1c. Move table config to `@repo/web-ui`

Move `use-resource-table-config.ts` and `table-sort.ts` from admin `lib/` to `@repo/web-ui/composables/` or a new `@repo/web-table` package if the table logic grows.

### Phase 2: Extract Reusable Hooks

#### 2a. `useAnimatePresence`

```ts
// packages/web-ui/src/hooks/use-animate-presence.ts
export function useAnimatePresence(
  isOpen: boolean,
  durationMs?: number
): { visible: boolean; animate: boolean }
```

**Replaces:** Identical 15-line blocks in `resource-drawer.tsx` and `bulk-action-bar.tsx`.

#### 2b. `useDebouncedUrlSearch`

```ts
// packages/web-ui/src/hooks/use-debounced-url-search.ts
export function useDebouncedUrlSearch<T extends Record<string, string>>({
  defaults,
  debounceMs,
  serialize,
  parse,
}: {
  defaults: T;
  debounceMs?: number;
  serialize: (params: T) => string;
  parse: (search: string) => T;
}): {
  params: T;
  debouncedParams: T;
  setSearch: <K extends keyof T>(key: K, value: T[K]) => void;
  setMany: (patch: Partial<T>) => void;
}
```

**Replaces:** ~50-line debounce+URL sync blocks in 6 controllers.

#### 2c. `SkeletonTableRows`

```tsx
// packages/web-ui/src/components/skeleton-table-rows.tsx
export function SkeletonTableRows({
  columns,
  count = 6,
}: {
  columns: { id: string; size?: number }[];
  count?: number;
})
```

**Replaces:** Inline skeleton rendering in `resource-table.tsx`.

### Phase 3: Controller Cleanup

#### 3a. Decompose Users List Controller

The users-list-controller should be split into composable sub-hooks:

```
users/controllers/
├── use-users-list-controller.ts       # Compose (target: <80 lines)
├── use-users-bulk-actions.ts          # ✅ Already extracted
├── use-users-confirm-block.ts         # ✅ Already extracted
├── use-create-user-drawer.ts          # ✅ Already extracted
├── use-users-list-url-state.ts        # 🆕 Extract search param + debounce logic
└── use-users-sorting.ts               # 🆕 Extract sort bridge config
```

The main controller becomes a thin orchestrator:
```ts
export function useUsersListController({ createColumns }) {
  const urlState = useUsersListUrlState({ defaults: { search: '', status: 'all', page: 1 } });
  const session = useSession();
  const users = useUsersListQuery(urlState.debouncedParams);
  const bulk = useUsersBulkActions(...);
  const block = useUsersConfirmBlock();
  const drawer = useCreateUserDrawer(...);
  const permissions = selectUserManagementPermissions(session.data?.data.permissions);

  return {
    session: { isLoading: session.isLoading, isError: session.isError },
    header: { ... },
    list: { ... },
    toolbar: { ... },
    bulk: { ... },
    pagination: { ... },
    createDrawer: { ... },
    confirmBlock: { ... },
    table,
  };
}
```

#### 3b. Naming Convention (New Code Only)

For **new features** created after this audit, use:
- File: `use<Feature>Handlers.ts`
- Export: `use<Feature>Handlers`
- Return type: `<Feature>ViewModel`

Do **not** rename existing files — gradual adoption only.

### Phase 4: UI Component Improvements

#### 4a. Page Shell Variants

```tsx
// List page (current pattern — good)
<ResourcePageShell resource={resource} description="..." actions={<Button>New</Button>} />

// Detail page (new variant)
<ResourcePageShell
  resource={resource}
  variant="detail"
  backHref="/users"
  title="User: John Doe"
  description="Account details and settings"
/>

// Settings page (new variant)
<ResourcePageShell
  resource={resource}
  variant="settings"
  description="Configure your application"
/>
```

#### 4b. Toolbar Presets

```tsx
// Search only
<ResourceToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search..." />

// Search + filter
<ResourceToolbar
  search={search}
  onSearchChange={setSearch}
  filters={<StatusFilter value={status} onChange={setStatus} />}
/>

// Search + actions
<ResourceToolbar
  search={search}
  onSearchChange={setSearch}
  actions={<Button size="sm">Export</Button>}
/>
```

#### 4c. Confirm Dialog Standardization

Replace custom `UsersConfirmBlockDialog` with standardized `@repo/web-ui/confirm-dialog`:

```tsx
<ConfirmDialog
  open={!!confirmBlock}
  title="Block user"
  description="This user will lose all access to the system."
  confirmLabel="Block"
  variant="destructive"
  isLoading={isPending}
  onConfirm={onConfirm}
  onCancel={onCancel}
/>
```

#### 4d. Shared Table Column Factory Pattern

Standardize how table columns are created across all features:

```ts
// Each feature defines a column factory
export function createUsersTableColumns({
  canUpdate,
  onActivate,
  onBlock,
  isDisabled,
}: UserColumnFactoryOptions): ColumnDef<AdminUserDto, any>[] {
  return [
    // ... column definitions
  ];
}
```

### Phase 5: Doc Consolidation

#### 5a. Single Canonical Source

Create `docs/architecture/CANONICAL.md` containing:
- FE layer rules + dependency matrix
- BE Clean Architecture rules
- Naming conventions
- Size limits
- Anti-patterns

All other docs link to it:
```markdown
## Architecture Rules
See [docs/architecture/CANONICAL.md](./CANONICAL.md) — single source of truth.
```

#### 5b. Archive/Remove

- `DESIGN.md` → merge decisions into canonical, archive the rest
- `.agents/skills/add-api-feature/SKILL.md` → rewrite to match current patterns
- `apps/admin/AGENTS.md` and `apps/web/AGENTS.md` → extract shared content, keep app-specific additions only

---

## 7. Migration Priority

| # | Task | Impact | Effort | Risk |
|---|------|--------|--------|------|
| 1 | Extract `useAnimatePresence` hook | Deduplicate animation in 2+ components | 🟢 Low | 🟢 Low |
| 2 | Extract `useDebouncedUrlSearch` hook | Remove ~300 lines of duplicated controller code | 🟡 Medium | 🟢 Low |
| 3 | Move shared components to `@repo/web-ui/composables/` | Unlock reuse in web + future apps | 🟡 Medium | 🟡 Medium |
| 4 | Create `@repo/web-bff` package | Eliminate HTTP setup duplication | 🟢 Low | 🟢 Low |
| 5 | Decompose users-list-controller | Demonstrate pattern, reduce complexity | 🟡 Medium | 🟡 Medium |
| 6 | Fix `@repo/web-core` ghost references | Eliminate doc/code mismatch | 🟢 Low | 🟢 Low |
| 7 | Consolidate architecture docs | Eliminate AI agent confusion | 🟢 Low | 🟢 Low |
| 8 | Fix SecurityResource + Dashboard config | Feature consistency | 🟢 Low | 🟢 Low |
| 9 | Naming convention migration (new code) | Gradual adoption, zero breakage | 🟢 Low | 🟢 Low |
| 10 | Extract `useResourceTableConfig` to shared | Enables reuse beyond admin | 🟡 Medium | 🟡 Medium |

**Recommended order:** 1 → 2 → 4 → 6 → 7 → 8 → 3 → 5 → 10 → 9

Start with the low-effort, high-impact extractions (hooks, package setup) before tackling the larger structural moves.

---

## 8. Proposed New Layout

### Shared Packages (after redesign)

```
packages/
├── web-ui/                 # Design system + shared UI
│   ├── src/components/     # 36 existing primitives
│   ├── src/hooks/          # NEW: useAnimatePresence, useDebouncedUrlSearch, etc.
│   ├── src/composables/    # NEW: ResourceShell, ResourceTable, ResourceDrawer, etc.
│   └── src/types/          # NEW: shared UI types
├── web-bff/                # NEW: HTTP client, CSRF, buildPath
├── web-hooks/              # Shared hooks (debouncedValue, isMobile)
├── web-utils/              # Shared utilities (errors, http, params, session)
├── web-test/               # Test utilities
├── api-contract/           # OpenAPI contract + generated clients
├── api-core/               # Shared NestJS infrastructure
├── api-database/           # Drizzle schema + migrations
├── api-identity/           # Bounded Context: auth, users, orgs
├── api-platform/           # Bounded Context: files, jobs, notifications, etc.
└── ...
```

### Admin Feature (after redesign)

```
apps/admin/src/features/users/
├── index.ts                        # Public exports
├── api/
│   ├── users.api.ts                # Fetch functions
│   ├── users.queries.ts            # useQuery hooks
│   ├── users.mutations.ts          # useMutation hooks
│   └── users.query-keys.ts         # Query key factory
├── model/
│   ├── users.types.ts              # TypeScript types
│   ├── users.schemas.ts            # Zod validation
│   ├── users.permissions.ts        # Permission selectors (pure)
│   ├── users.search-params.ts      # URL param parse/serialize
│   └── constants.ts                # Feature constants
├── controllers/
│   ├── use-users-list-controller.ts    # Thin orchestrator (target: <80 lines)
│   ├── use-users-list-url-state.ts     # 🆕 Extracted URL state
│   ├── use-users-bulk-actions.ts       # Existing (good)
│   ├── use-users-confirm-block.ts      # Existing (good)
│   ├── use-create-user-drawer.ts       # Existing (good)
│   └── use-user-detail-controller.ts   # Detail page controller
├── screens/
│   ├── users-view.tsx              # List screen
│   └── user-detail-view.tsx        # Detail screen
└── ui/
    ├── users-list-view.tsx         # List presentational
    ├── users-table-columns.tsx     # Column definitions
    ├── create-user-drawer.tsx      # Create form
    ├── users-confirm-block-dialog.tsx  # Confirm dialog
    └── user-detail-*.tsx           # Detail page atoms
```

### Import Flow (after redesign)

```
page.tsx
  ↓
UsersView (screen)
  ↓
useUsersListController (orchestrator)
  ├── useDebouncedUrlSearch (from @repo/web-ui/hooks)
  ├── useSession (from @/hooks)
  ├── useUsersListQuery (from ./api)
  ├── useUsersBulkActions (from ./controllers)
  ├── useResourceTableConfig (from @repo/web-ui/composables)
  └── selectUserManagementPermissions (from ./model)
  ↓
UsersListView (presentational)
  ├── ResourcePageShell (from @repo/web-ui/composables)
  ├── ResourceToolbar (from @repo/web-ui/composables)
  ├── ResourceTable (from @repo/web-ui/composables)
  ├── BulkActionBar (from @repo/web-ui/composables)
  ├── Pagination (from @repo/web-ui)
  └── CreateUserDrawer (from ./ui)
```

---

## Appendix A: Feature Inventory

| # | Feature | Controllers | UI Files | API Files | Model Files | Screens |
|---|---------|-------------|----------|-----------|-------------|---------|
| 1 | users | 7 | 11 | 4 | 5 | 2 |
| 2 | roles | 1 | 3 | 4 | 5 | 1 |
| 3 | organizations | 3 | ~6 | 4 | 4 | 2 |
| 4 | dashboard | 1 | 6 | 3 | 3 | 1 |
| 5 | settings | 1 | 3 | 3 | 3 | 1 |
| 6 | audit-logs | 1 | 3 | 4 | 3 | 1 |
| 7 | notifications | 1 | 3 | 4 | 3 | 1 |
| 8 | jobs | 1 | ~3 | 4 | 3 | 1 |
| 9 | files | 1 | ~4 | 4 | 3 | 1 |
| 10 | mail | 3 | ~3 | 4 | 3 | 1 |
| 11 | imports | 1 | ~3 | 4 | 3 | 1 |
| 12 | security | 3 | 7 | 2 | 2 | 1 |
| 13 | auth | 3 | ~4 | 2 | 6 | ~3 |

## Appendix B: Shared Package Dependencies

```
@repo/web-ui
  ├── @base-ui/react
  ├── @repo/web-utils
  ├── class-variance-authority
  ├── clsx + tailwind-merge
  ├── lucide-react
  ├── react-day-picker
  ├── cmdk
  └── input-otp

@repo/web-utils
  ├── (no external deps — pure utilities)
  └── Exports: cn, webFetch, errors, params, session, storage

@repo/web-hooks
  ├── (no external deps — pure hooks)
  └── Exports: useDebouncedValue, useIsMobile
```

---

*Generated by architecture audit — 2026-08-20*
