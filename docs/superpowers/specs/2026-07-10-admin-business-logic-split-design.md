# Admin app restructuring — Phase 1: split business logic from UI

Status: implemented (2026-07-11, as part of the re-architecture roadmap P0-P8)
Owner: admin app (`apps/admin`)

## Context

The admin app's `apps/admin/src/features/auth/` already demonstrates the intended
pattern for this codebase: `auth-service.ts` (API calls), `auth-schemas.ts` /
`auth-errors.ts` (domain types), and `use-admin-login-flow.ts` (a hook that
orchestrates the service + form state) all live apart from `login-view.tsx`,
which only renders.

Every other resource under `apps/admin/src/app/(app)/<resource>/` ignores this
pattern: `useQuery`/`useMutation`/`webFetch` calls, zod schemas, and
`react-hook-form` wiring are written directly inside the `*-view.tsx` file
alongside JSX. Several of these files have grown large as a result:

| File | Lines | Embedded business logic |
|---|---|---|
| `mail/mail-view.tsx` | 680 | 3 queries, 1 mutation |
| `jobs/jobs-view.tsx` | 624 | 4 queries, 1 mutation |
| `notifications/notifications-view.tsx` | 436 | 2 queries, 2 mutations |
| `users/users-view.tsx` | 422 | 2 inline `webFetch` status-update calls |
| `roles/roles-view.tsx` | — | 2 queries, delete mutation, permission-catalog logic |
| `files/files-view.tsx` | — | 3 queries, 3 mutations, upload/version logic |
| `settings/settings-view.tsx` | — | 1 query, 1 mutation |
| `security/mfa-management.tsx` | — | 1 query, 4 mutations |
| `security/change-password-form.tsx` | — | 1 mutation, form schema |
| `imports/imports-view.tsx` | — | 1 query, 2 mutations |
| `audit-logs/audit-logs-view.tsx` | — | 1 query |
| `users/[id]/user-detail-view.tsx` | — | 2 queries, 3 mutations, zod schema |
| `dashboard-view.tsx` | — | 4 parallel queries (`useQueries`) |

This spec covers moving that logic out, resource by resource, with no behavior
change. It's the first of three phases agreed with the user; phases 2 (shell:
tenant badge + theme toggle) and 3 (i18n locale routing + language switcher)
are separate specs that follow this one.

## Goal

For every resource, business logic (data fetching, mutations, schemas,
constants, sorting/search-param serialization) lives in
`apps/admin/src/features/<resource>/`, and everything under
`apps/admin/src/app/(app)/<resource>/` is limited to: the route's `page.tsx`
and presentational components that receive data and callbacks from hooks —
never call `webFetch`, `useQuery`, or `useMutation` directly.

## Non-goals

- No behavior changes, no new dependencies, no visual changes.
- No change to API routes, contract, or backend code.
- Not touching i18n or tenant work (separate specs).
- Not introducing a deeper layering (e.g. `domain/`/`infrastructure/`
  subfolders) beyond what `features/auth/` already uses — resources here are
  small enough that a flat `features/<resource>/` directory is proportionate.
  Revisit only if a single resource's logic file exceeds ~300 lines after the
  move.

## Target structure

Per resource `<resource>`:

```
apps/admin/src/features/<resource>/
  <resource>-service.ts       # plain functions wrapping webFetch calls
  use-<resource>-queries.ts   # useQuery hooks
  use-<resource>-mutations.ts # useMutation hooks (grouped by concern if many)
  <resource>-schemas.ts       # zod schemas + inferred types (if any forms)
  constants.ts                # query keys, enums, option lists (if any)
  # carried over unchanged from the old location, same filenames:
  sorting.ts / sorting.test.ts
  <resource>-search-params.ts / .test.ts
  types.ts
  api.test.ts -> <resource>-service.test.ts (renamed to match new filename)

apps/admin/src/app/(app)/<resource>/
  page.tsx                    # unchanged route entry, thin
  <resource>-view.tsx         # presentational only, imports hooks from features/
  <resource>-table-columns.tsx
  <resource>-drawer.tsx / dialog files
  [id]/page.tsx, [id]/<resource>-detail-view.tsx (where applicable)
```

Rule going forward (add to `apps/admin/AGENTS.md` or root `CLAUDE.md` if one
exists for admin, otherwise call out in the PR description): **no
`app/(app)/**` file may import `@tanstack/react-query` or
`@/lib/http` directly** — that's the signal a query/mutation snuck back into a
view.

## Per-resource migration plan

`users/` already has the most separation (`api.ts`, `use-users-queries.ts`,
`types.ts`, `constants.ts`, `sorting.ts`, `users-search-params.ts` are already
outside the view). It becomes the reference migration:

1. **users** (reference / do first)
   - Move `api.ts` → `features/users/users-service.ts`
   - Move `use-users-queries.ts` → `features/users/use-users-queries.ts`
   - Move `constants.ts`, `sorting.ts` (+ test), `users-search-params.ts` (+
     test), `types.ts` → `features/users/`
   - Extract the two inline `webFetch` status-update calls in
     `users-view.tsx` into `features/users/use-users-mutations.ts`
     (`useActivateUsers`, `useBlockUsers` or similar, matching the existing
     `useBulkMutation` hook usage)
   - `users-view.tsx`, `users-table-columns.tsx`, `create-user-drawer.tsx`,
     `actions-dropdown.tsx` stay in `app/(app)/users/`, now importing from
     `@/features/users/*`

2. **users/[id] (detail)**
   - Extract `profileSchema`, the 2 queries (user, roles) and 3 mutations
     (updateProfile, updateStatus, replaceRoles) from `user-detail-view.tsx`
     into `features/users/use-user-detail-queries.ts`,
     `use-user-detail-mutations.ts`, `user-schemas.ts`
   - `user-detail-view.tsx` keeps only form rendering + calls the hooks

3. **roles**
   - New `features/roles/`: `roles-service.ts` (list roles, permission
     catalog, delete), `use-roles-queries.ts`, `use-roles-mutations.ts`
   - `ManagedRoleDto`/`PermissionDto` types → `features/roles/roles-schemas.ts`
   - `roles-view.tsx`, `role-form-drawer.tsx` stay, now hook-driven

4. **audit-logs**
   - `features/audit-logs/use-audit-logs-queries.ts` for the single query;
     `audit-logs-view.tsx` stays presentational

5. **files**
   - `features/files/files-service.ts` + `use-files-queries.ts` (files,
     versions, history) + `use-files-mutations.ts` (delete, upload, upload
     version) — including the inline `webFetch` call for the signed URL
     fetch inside the render tree
   - `files-view.tsx` stays, hook-driven

6. **imports**
   - `features/imports/use-imports-queries.ts` (job polling query) +
     `use-imports-mutations.ts` (create, confirm)

7. **jobs**
   - `features/jobs/use-jobs-queries.ts` (jobs list, metrics, job detail, job
     logs) + `use-jobs-mutations.ts` (cancel)

8. **mail**
   - `features/mail/use-mail-queries.ts` (templates, deliveries, preview) +
     `use-mail-mutations.ts` (send)

9. **notifications**
   - `features/notifications/use-notifications-queries.ts` (jobs, recent) +
     `use-notifications-mutations.ts` (send, cancel job)

10. **security**
    - `features/security/security-service.ts` + `use-security-mutations.ts`
      for `change-password-form.tsx`'s mutation + schema
    - `features/security/use-mfa-queries.ts` / `use-mfa-mutations.ts` for
      `mfa-management.tsx` (status query; setup/confirm/disable/regenerate
      mutations)
    - Both form components stay in `app/(app)/security/`, hook-driven

11. **settings**
    - `features/settings/use-settings-queries.ts` + `use-settings-mutations.ts`

12. **dashboard**
    - `features/dashboard/use-dashboard-queries.ts` wrapping the
      `useQueries` call (4 parallel fetches)
    - `dashboard-view.tsx` stays in `app/(app)/`, hook-driven

Each numbered item above is an independently shippable unit of work — own
commit at minimum, one commit per resource — in the listed order. Order
matters only for #1 (users) being the template the rest copy — 2 through 12
have no dependency on each other and can be done in any order or in
parallel. Whether they land as one PR or several is an execution-plan
decision, not part of this spec.

## Testing

- Existing unit tests (`api.test.ts`, `sorting.test.ts`,
  `users-search-params.test.ts`) move with their logic and keep passing
  unchanged (only import paths change).
- No new test coverage is required by this phase — it's a mechanical move —
  but any resource whose extracted hook has no existing test (i.e. every
  resource except users) should get a minimal smoke test for its service
  functions (URL/query-key construction), mirroring `api.test.ts`'s style,
  since that logic previously had zero tests hidden inside a view file.
- `pnpm --filter admin test` and `pnpm --filter admin typecheck` must pass
  after each resource's migration.

## Verification

- `pnpm lint` (source-policy + turbo lint) and `pnpm typecheck` clean.
- Manually exercise each migrated resource's page in the browser (list load,
  create/edit, delete, bulk actions where applicable) to confirm no
  regression — this is a pure refactor so behavior must be pixel-for-pixel
  identical.
- Grep guard: `grep -rl "useQuery\|useMutation" apps/admin/src/app` should
  return nothing once all 12 items are done.

## Risks

- Large diffs per resource (mail/jobs) — mitigate by keeping the extraction
  mechanical (cut/paste + import fixup) in its own commit before any
  follow-on cleanup, so review is easy.
- Query key collisions if a resource's constants aren't namespaced — audit
  existing `*_QUERY_KEY` constants during the move to ensure uniqueness is
  preserved.
