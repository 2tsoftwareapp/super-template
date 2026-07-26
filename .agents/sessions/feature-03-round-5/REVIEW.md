# Feature 03 — Roles & Permissions / RBAC — Round 5 Review

## 1. Overview findings

- Reviewed range: `2690815e58d2acd632f120d8dc14fdf9d963de6d..3c9663b862aceeb27d49ed677d7b20d18209b6e8`
- Remediation HEAD: `3c9663b862aceeb27d49ed677d7b20d18209b6e8`
- Verdict: **Blocked**
- Ready for done: **No**
- Findings: **1 Critical, 4 Medium, 2 Low, 1 Info**

### Confirmed fixes

- Fresh execution of migration `0033` now classifies known organization and platform permissions separately.
- Unknown legacy permissions fail closed to platform scope.
- Platform permission assignments are removed from organization roles during a fresh `0033` execution.
- Seed reconciliation updates the scope of existing seeded permission names.
- Permission scope CHECK constraint is represented in the Drizzle schema.
- Admin role listing sends page/search/filter parameters to the backend.
- Backend pagination response now returns `totalPages`.
- Integer validation and constraint-specific role-name conflict mapping remain intact.

### Blocker

The implementation modifies the already-existing migration file `0033_permission_scope_column.sql`. The custom migration ledger tracks only the migration filename. Any environment that already recorded `0033_permission_scope_column.sql` as applied will skip the edited SQL permanently. Those databases therefore retain the incorrect scope values produced by the previous version.

---

## 2. Detail findings

## C-001 — Editing migration 0033 does not repair databases that already applied it

**Severity:** Critical  
**Category:** Migration / Upgrade safety / Authorization

### Paths

```text
apps/api/drizzle/0033_permission_scope_column.sql
apps/api/src/cli/migrations.ts
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
```

### Description

The updated `0033` is correct only when that filename has not yet been applied.

The migration runner stores applied migrations in `public.__app_migrations` using `filename text NOT NULL UNIQUE`. During migration it loads the applied filename set and skips any matching file. It does not compare a hash or rerun changed SQL.

Therefore, a database that previously applied the old `0033_permission_scope_column.sql` will not execute the new organization-scope backfill or platform-assignment cleanup.

The old version set all remaining NULL scopes to `platform`. In an already-upgraded environment, standard permissions such as `users.*`, `roles.*`, `files.*`, `notifications.*`, `imports.*`, and `activities.*` can remain incorrectly marked as platform.

Seed reconciliation only updates permissions returned by `allSeedPermissionNames()`. It improves current seed entries, but it is not a substitute for a forward data-repair migration, and it does not guarantee cleanup of all invalid platform assignments already attached to organization roles.

### Solution

Create a new forward migration, for example:

```text
0035_repair_permission_scopes.sql
```

The new migration should:

1. Set every known organization resource to `organization` unconditionally.
2. Set every known platform resource to `platform` unconditionally.
3. Set unknown/unclassified permissions to `platform`.
4. Remove every platform permission from every organization-scoped role using `permissions.scope`, not a hardcoded prefix list.
5. Optionally assert that no invalid organization-role grant remains.

Do not rely on editing `0033` for repair. Historical migrations should remain immutable once they may have been applied.

### DoD

- [ ] A new forward migration exists after `0034`.
- [ ] Database with the old `0033` ledger entry is repaired.
- [ ] Known organization permissions are corrected even when their existing scope is non-NULL and wrong.
- [ ] Known platform permissions are corrected unconditionally.
- [ ] Unknown permissions remain platform-scoped.
- [ ] No organization role retains a platform permission.
- [ ] Existing organization ADMIN permissions are restored correctly.
- [ ] PostgreSQL upgrade fixture starts from the previously broken `0033` state and passes.

---

## M-001 — Generated OpenAPI contract remains stale

**Severity:** Medium  
**Category:** API contract / Code generation

### Paths

```text
packages/api-identity/src/modules/access-control/presentation/admin-roles.controller.ts
packages/api-identity/src/modules/access-control/presentation/roles.dto.ts
apps/api/openapi.json
packages/api-contract/src/generated/index.ts
apps/admin/src/features/roles/api/roles.api.ts
```

### Description

Runtime now accepts pagination and filtering query parameters and returns paginated metadata.

However, `apps/api/openapi.json` and `packages/api-contract/src/generated/index.ts` were not changed in the remediation range. The generated path still declares `query?: never` for `/api/v1/admin/roles`.

The admin client therefore continues to use a handwritten `ListResponse<ManagedRoleDto>` instead of the generated operation response.

### Solution

- Regenerate OpenAPI from the current NestJS decorators and DTOs.
- Regenerate `@repo/api-contract`.
- Type `rolesApi.list()` using the generated operation query and response types.
- Add `pnpm generate:check` to required verification.

### DoD

- [ ] Generated contract exposes page, limit, search, organizationId, and scope.
- [ ] Generated response includes pagination metadata and `totalPages`.
- [ ] Admin role API uses generated types.
- [ ] `pnpm generate:check` passes.

---

## M-002 — Permission catalog completeness is not enforced

**Severity:** Medium  
**Category:** Authorization design / Maintainability

### Paths

```text
packages/api-core/src/common/rbac/permission-catalog.ts
packages/api-core/src/common/rbac/default-role-grants.matrix.ts
packages/api-identity/src/modules/access-control/domain/access-control-seed.catalog.ts
```

### Description

`RESOURCE_SCOPE` is now the central runtime catalog and unknown resources fail closed to platform scope. This removes the privilege-escalation failure mode.

However, `ResourceGrant.resource` is still typed as `string`, not `CatalogResource`, and no completeness test was added. A developer can add a new organization resource to `DEFAULT_ROLE_GRANTS` without adding it to `RESOURCE_SCOPE`; the permission will silently become platform-scoped and organization administrators will lose access to it.

The seed catalog also duplicates `scopeForPermission()` rather than importing the canonical helper.

### Solution

- Type `ResourceGrant.resource` as `CatalogResource`.
- Use the exported `scopeForPermission()` from the core catalog.
- Add a test asserting every resource present in role grants exists in `RESOURCE_SCOPE`.
- Add a test asserting every seeded permission resolves to the expected explicit scope.

### DoD

- [ ] TypeScript rejects a grant resource absent from the catalog.
- [ ] Seed does not duplicate scope-classification logic.
- [ ] Catalog completeness test passes.
- [ ] Unknown runtime resources remain fail-closed.

---

## M-003 — Organization and scope filters are URL-capable but absent from the UI

**Severity:** Medium  
**Category:** Frontend completeness

### Paths

```text
apps/admin/src/features/roles/api/roles.api.ts
apps/admin/src/features/roles/controllers/use-roles-controller.ts
apps/admin/src/features/roles/model/roles.types.ts
apps/admin/src/features/roles/ui/roles-list-view.tsx
```

### Description

The controller reads `scope` and `organizationId` from the URL and sends them to the backend. The view model and UI expose only search and pagination controls.

Users cannot select organization or scope through the screen, despite these being part of the backend pagination contract and previous review DoD.

### Solution

- Add scope filter controls.
- Add organization filter for SUPER_ADMIN.
- Reset page to 1 when either filter changes.
- Preserve filters in the URL.
- Validate/sanitize URL values before sending them to the API.

### DoD

- [ ] SUPER_ADMIN can filter by organization.
- [ ] Authorized users can filter by platform/organization scope where applicable.
- [ ] Filter state is reflected in the URL.
- [ ] Changing a filter resets page to 1.
- [ ] Frontend tests verify query parameters.

---

## M-004 — PostgreSQL integration and CI evidence are still absent

**Severity:** Medium  
**Category:** Verification / CI

### Paths

```text
apps/api/test/
.github/workflows/
apps/api/src/cli/migrations.ts
```

### Description

No PostgreSQL-backed tests were added for the migrations, scope repair, trigger, seed replay, or concurrency paths. GitHub exposes no workflow run or combined status for the reviewed HEAD.

Unit tests cannot verify the filename-ledger upgrade issue, SQL DDL, PL/pgSQL triggers, or PostgreSQL transaction behavior.

### Solution

Add a PostgreSQL service to CI and run migration/integration suites as required checks.

### DoD

- [ ] Clean migration chain passes.
- [ ] Upgrade from the old broken `0033` state passes.
- [ ] Seed replay twice passes.
- [ ] Organization-role/platform-permission cleanup is verified.
- [ ] Trigger matrix passes.
- [ ] Role provisioning and rename concurrency tests pass.
- [ ] GitHub checks are visible and successful.

---

## L-001 — Search sends a backend request for each keystroke

**Severity:** Low  
**Category:** Performance / UX

### Paths

```text
apps/admin/src/features/roles/controllers/use-roles-controller.ts
apps/admin/src/features/roles/api/roles.queries.ts
```

### Description

Every search input change immediately replaces the URL, changes the React Query key, and issues another request. Rapid typing can create unnecessary network traffic and transient stale-page rendering.

### Solution

Debounce server search by approximately 250–400 ms while keeping the input responsive.

### DoD

- [ ] Rapid typing is coalesced into fewer backend calls.
- [ ] Clearing search resets page to 1.
- [ ] URL state remains shareable.

---

## L-002 — Pagination/filter API types are broader than the backend contract

**Severity:** Low  
**Category:** Type safety

### Paths

```text
apps/admin/src/features/roles/api/roles.api.ts
apps/admin/src/features/roles/controllers/use-roles-controller.ts
```

### Description

`RolesListParams.scope` is typed as `string` rather than `'platform' | 'organization'`. URL values are passed through without local validation, so a malformed URL can generate an avoidable backend 400 and error-state screen.

### Solution

- Narrow the scope type.
- Parse URL scope against an allowlist.
- Validate organizationId before including it in query parameters where practical.

### DoD

- [ ] Invalid scope is ignored or normalized client-side.
- [ ] TypeScript prevents unsupported scope values.
- [ ] Valid filters continue to work.

---

## I-001 — Security-critical runtime controls are materially improved

**Severity:** Info

The following improvements should be retained:

- Unknown permission resources fail closed to platform scope.
- Organization roles reject DB-classified platform permissions.
- Seed reconciles the scope of existing seeded permissions.
- Migration cleanup uses `permissions.scope` rather than only name prefixes.
- Server-driven pagination and stable URL state are present.
- Constraint-specific conflict mapping, tenant isolation, audit context, and role UI separation remain intact.

---

## 3. Checklist tasks

### Critical

- [ ] **R5-T001:** Add a new forward permission-scope repair migration.
- [ ] **R5-T002:** Repair databases that already applied the old `0033`.
- [ ] **R5-T003:** Remove all platform grants from organization roles.
- [ ] **R5-T004:** Add a broken-upgrade PostgreSQL fixture.

### Medium

- [ ] **R5-T005:** Regenerate OpenAPI and API contracts.
- [ ] **R5-T006:** Use generated query/response types in admin.
- [ ] **R5-T007:** Type role-grant resources from the scoped catalog.
- [ ] **R5-T008:** Add catalog completeness tests.
- [ ] **R5-T009:** Add organization and scope filter controls.
- [ ] **R5-T010:** Add PostgreSQL integration CI.

### Low

- [ ] **R5-T011:** Debounce server search.
- [ ] **R5-T012:** Narrow and sanitize frontend filter types.

---

## 4. Verify

```bash
pnpm --filter @repo/api-core lint
pnpm --filter @repo/api-core typecheck
pnpm --filter @repo/api-identity lint
pnpm --filter @repo/api-identity typecheck

pnpm --filter api test
pnpm --filter api test:e2e

pnpm --filter admin lint
pnpm --filter admin typecheck
pnpm --filter admin test

pnpm generate
pnpm generate:check
pnpm check
pnpm verify
```

PostgreSQL scenarios:

```text
1. Fresh database migration chain
2. Database with 0033 already recorded in __app_migrations
3. users.read incorrectly stored as platform before forward repair
4. unknown legacy permission attached to an organization role
5. organization ADMIN with existing organization permissions
6. seed replay twice
7. user-role trigger scope matrix
8. concurrent organization ADMIN provisioning
9. concurrent custom-role rename
10. more than 50 roles with search, scope and organization filters
```

Round 5 acceptance requires the new forward repair migration and visible PostgreSQL/CI evidence.

---

## 5. Commit message

```text
fix(rbac): add forward scope repair and complete role management contracts

- add a forward migration for databases that already applied permission scope v1
- restore known organization scopes and remove platform grants from org roles
- enforce scoped permission catalog completeness at compile time
- regenerate OpenAPI and generated API contracts
- use generated pagination types in the admin client
- expose organization and scope filters in the roles UI
- debounce server-side role search
- add PostgreSQL migration, seed replay, and concurrency tests
```
