# Feature 03 — Roles & Permissions / RBAC — Review Round 3

## 1. Overview findings

- **Review range:** `30d5cbd8d05b6ea27cb3c13947b4cbb3e89e8223..63914a72391f6127237dfb051d27717635df39d4`
- **Remediation HEAD:** `63914a72391f6127237dfb051d27717635df39d4`
- **Verdict:** `Blocked`
- **Ready for done:** No
- **Production code modified by review:** No

### Finding counts

| Severity | Count |
|---|---:|
| Critical | 2 |
| High | 1 |
| Medium | 5 |
| Low | 0 |
| Info | 1 |

### Confirmed fixes

- Platform fixed-role seed lookup now resolves roles with explicit `organization_id IS NULL`.
- Non-`SUPER_ADMIN` role listing is restricted to platform `USER`, own-organization `ADMIN`, and own-organization custom roles.
- Cross-tenant `organizationId` role-list filters are rejected.
- Role authorization reads stored permission scope when assigning permissions to organization roles.
- Concurrent rename uniqueness errors are allowed to roll back before being mapped to HTTP 409.
- Role query DTO now validates UUID, scope, limits, and search length.
- Role list ordering is stable by `(name, id)`.
- UI system-role separation, audit request context, and previous regression controls remain in place.

### Blocking summary

1. Migration `0032` can still fail when the same user is assigned to two duplicate organization system roles and no canonical assignment exists.
2. Trigger migration `0034` compares a UUID column with a `text` variable, so the trigger can fail on every `user_roles` insert/update.
3. Permission classification remains fail-open because seed/repository fallbacks still infer platform scope from a four-resource name list and classify unknown permissions as organization-scoped.

---

# 2. Detail findings

## C-001 — Organization-role dedupe can violate `user_roles` primary key

**Severity:** Critical  
**Category:** Migration correctness / Availability / Data preservation

### Paths

```text
apps/api/drizzle/0032_org_system_role_unique_and_cleanup.sql
packages/api-database/src/schema/identity/access-control.ts
```

### Mô tả lỗi

The migration now correctly materializes duplicate-role mappings in `_org_role_dedup`, so the previous cross-statement CTE error is fixed.

However, it rewires assignments with one bulk update:

```sql
UPDATE user_roles ur
SET role_id = d.keep_id
FROM _org_role_dedup d
WHERE ur.role_id = ANY(d.delete_ids)
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = ur.user_id
      AND ur2.role_id = d.keep_id
  );
```

`user_roles` has primary key `(user_id, role_id)`.

A realistic legacy state created by the original concurrency bug is:

```text
user-1 → duplicate-admin-role-A
user-1 → duplicate-admin-role-B
```

with no assignment yet to the canonical role.

Both rows pass the `NOT EXISTS` condition and both are updated to:

```text
user-1 → canonical-admin-role
```

The statement then violates the primary key and aborts the migration. This is precisely the kind of state the dedupe migration needs to repair.

### Giải pháp

Do not update duplicate assignment rows in place.

Use a migration flow such as:

1. Insert canonical assignments from duplicate assignments:

```sql
INSERT INTO user_roles (user_id, role_id, organization_id, assigned_at)
SELECT DISTINCT
  ur.user_id,
  d.keep_id,
  d.organization_id,
  MIN(ur.assigned_at) OVER (PARTITION BY ur.user_id, d.keep_id)
FROM user_roles ur
JOIN _org_role_dedup d ON ur.role_id = ANY(d.delete_ids)
ON CONFLICT (user_id, role_id) DO NOTHING;
```

2. Delete assignments referencing duplicate role IDs.
3. Merge role permissions with `ON CONFLICT DO NOTHING`.
4. Delete duplicate roles.
5. Add the unique index.

Prefer an aggregate subquery rather than a window expression if it makes the insert contract clearer.

### DoD

- [ ] Migration succeeds when one user is assigned to two or more duplicate organization `ADMIN` roles.
- [ ] Exactly one canonical assignment remains for that user.
- [ ] Existing canonical assignments are preserved.
- [ ] Earliest or otherwise explicitly selected `assigned_at` is preserved.
- [ ] No user loses organization-admin access.
- [ ] Duplicate role permissions are merged without conflict.
- [ ] The organization system-role unique index is created successfully.
- [ ] A PostgreSQL migration fixture covers this exact legacy state.

---

## C-002 — `check_user_role_scope()` compares UUID to `text`

**Severity:** Critical  
**Category:** Migration correctness / Runtime availability

### Paths

```text
apps/api/drizzle/0034_user_roles_org_consistency.sql
packages/api-database/src/schema/identity/access-control.ts
```

### Mô tả lỗi

The trigger function declares:

```sql
DECLARE
  role_org_id text;
```

but both `roles.organization_id` and `NEW.organization_id` are UUID columns.

It then executes:

```sql
IF NEW.organization_id IS DISTINCT FROM role_org_id THEN
```

PostgreSQL does not provide a UUID-to-text equality operator for this expression. The PL/pgSQL function may be created, but execution of the statement can fail with an operator/type-resolution error when a `user_roles` row is inserted or updated.

This means normal role assignment can become unavailable immediately after the migration.

### Giải pháp

Declare the variable with the exact database type:

```sql
DECLARE
  role_org_id roles.organization_id%TYPE;
```

or:

```sql
DECLARE
  role_org_id uuid;
```

Using `%TYPE` is preferable because it follows future schema changes.

Keep the original single-column foreign key:

```text
user_roles.role_id → roles.id
```

and use the trigger only for null-safe organization-scope consistency.

### DoD

- [ ] Trigger function uses `roles.organization_id%TYPE` or `uuid`.
- [ ] Platform role with `organization_id = NULL` can be assigned with `NULL` scope.
- [ ] Organization role can be assigned with the matching organization ID.
- [ ] Organization role with `NULL` assignment scope is rejected.
- [ ] Organization role with another organization ID is rejected.
- [ ] Platform role with non-null assignment scope is rejected.
- [ ] Missing role ID remains rejected by the foreign key or trigger.
- [ ] PostgreSQL integration tests execute all six cases.

---

## H-001 — Permission scope is still inferred with a fail-open name heuristic

**Severity:** High  
**Category:** Authorization design / Privilege boundary

### Paths

```text
apps/api/drizzle/0033_permission_scope_column.sql
packages/api-database/src/schema/identity/access-control.ts
packages/api-identity/src/modules/access-control/domain/access-control-seed.catalog.ts
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
packages/api-identity/src/modules/access-control/application/use-cases/role-management.use-case.ts
packages/api-identity/src/modules/access-control/presentation/roles.dto.ts
```

### Mô tả lỗi

The database column is now `NOT NULL` with a valid-value check, and authorization correctly reads `permission.scope`. Those are good improvements.

The classification source is still not explicit or fail-closed:

1. `PERMISSION_SEED_ENTRIES` derives scope through `isPlatformPermission(name)`, which recognizes only `settings`, `audit`, `mail`, and `jobs`.
2. `ensurePermissions()` contains another local copy of the same four-resource heuristic.
3. `createPermission()` contains another local copy and defaults unknown names to `organization`.
4. Migration `0033` backfills every unrecognized existing permission to `organization`.
5. `CreatePermissionDto` does not require a scope field.

A future permission such as:

```text
billing.update
tenants.delete
feature-flags.manage
```

is therefore classified as organization-scoped unless a developer remembers to update every separate name list. Once stored as `organization`, the authorization layer trusts that DB value and allows delegation to organization roles.

The source of truth has moved to the database, but the process that writes the source of truth still fails open.

### Giải pháp

- Define every seed permission with an explicit scope beside its name; do not derive scope from the resource prefix.
- Make `scope` required in `PermissionSeedEntry`, repository create contracts, and any permission-creation DTO/API.
- Remove fallback classification from `ensurePermissions()` and `createPermission()`.
- Treat missing scope as an error rather than defaulting to organization.
- For legacy backfill, explicitly map known organization permissions; classify all unknown permissions as `platform` or abort migration for manual classification.
- Add a catalog completeness test ensuring every permission has one explicit valid scope.

### DoD

- [ ] No seed permission scope is computed through `isPlatformPermission()`.
- [ ] Repository permission inserts require explicit scope.
- [ ] Permission creation API requires and validates explicit scope, or permission CRUD is removed if intentionally unsupported.
- [ ] Unknown legacy permissions do not default to organization scope.
- [ ] A new unclassified permission causes build/bootstrap/test failure.
- [ ] Organization roles cannot receive any permission explicitly marked `platform`.
- [ ] Catalog completeness test covers every seeded permission.

---

## M-001 — Admin UI still exposes only the first backend page

**Severity:** Medium  
**Category:** Functional completeness / Operator UX

### Paths

```text
apps/admin/src/features/roles/api/roles.api.ts
apps/admin/src/features/roles/controllers/use-roles-controller.ts
apps/admin/src/features/roles/ui/roles-list-view.tsx
```

### Mô tả lỗi

The backend defaults role listing to `limit=50` and now returns pagination metadata.

The admin client still calls:

```text
GET /api/v1/admin/roles
```

without page, limit, organization, search, or scope parameters. It also does not consume `meta.total` or render pagination controls.

As a result, roles after the first 50 are silently inaccessible in the UI. Client-side search only searches the loaded first page, so it can incorrectly report no results for roles that exist on later pages.

### Giải pháp

- Extend `rolesApi.list(params)` with page, limit, organizationId, search, and scope.
- Store pagination/filter state in the roles controller.
- Perform search/filter server-side.
- Render page controls and result counts.
- Reset page to 1 when search/filter changes.
- Preserve page/filter state when returning from role edit flows where appropriate.

### DoD

- [ ] Operator can navigate all role pages.
- [ ] Search includes roles beyond the first page.
- [ ] Organization and scope filters are sent to the API.
- [ ] Page resets when filters change.
- [ ] Empty state distinguishes no data from no results.
- [ ] Frontend tests cover more than 50 roles and page navigation.

---

## M-002 — OpenAPI and generated contracts are stale

**Severity:** Medium  
**Category:** API contract / Client compatibility

### Paths

```text
packages/api-identity/src/modules/access-control/presentation/admin-roles.controller.ts
packages/api-identity/src/modules/access-control/presentation/roles.dto.ts
apps/api/openapi.json
packages/api-contract/src/generated/index.ts
```

### Mô tả lỗi

The endpoint now accepts validated pagination query parameters and returns pagination metadata, but the remediation range does not update OpenAPI or generated API contracts.

`@ApiArrayResponse(RoleDto)` also describes an array response but does not explicitly document the new pagination metadata contract.

Clients generated from the current contract cannot rely on the new query parameters or response meta shape.

### Giải pháp

- Introduce or reuse a paginated response DTO that documents `data` and `meta`.
- Decorate the endpoint with the correct paginated response schema.
- Regenerate OpenAPI and `@repo/api-contract` outputs in CI or a Docker-enabled environment.
- Commit generated artifacts and enforce `pnpm generate:check`.

### DoD

- [ ] OpenAPI documents page, limit, organizationId, search, and scope.
- [ ] OpenAPI documents pagination metadata.
- [ ] Generated contract includes the updated query and response types.
- [ ] Admin code consumes generated contract types where applicable.
- [ ] `pnpm generate:check` passes.

---

## M-003 — Database-backed integration evidence is still absent

**Severity:** Medium  
**Category:** Testing / Verification

### Paths

```text
apps/api/test/
.github/workflows/
apps/api/drizzle/0032_org_system_role_unique_and_cleanup.sql
apps/api/drizzle/0033_permission_scope_column.sql
apps/api/drizzle/0034_user_roles_org_consistency.sql
```

### Mô tả lỗi

No PostgreSQL-backed tests were added in this remediation range for:

- migration `0032` duplicate-role fixtures;
- migration `0033` permission scope backfill and constraints;
- migration `0034` trigger execution;
- concurrent organization role provisioning;
- concurrent custom-role rename;
- cross-tenant role listing.

GitHub exposes no combined status checks and no workflow runs for `63914a7`.

Existing unit tests do not execute PostgreSQL DDL, partial indexes, triggers, transaction abort behavior, or migration upgrade fixtures.

### Giải pháp

Add a disposable PostgreSQL service in CI and run:

1. clean migration chain;
2. legacy upgrade fixtures;
3. seed replay;
4. concurrency tests;
5. tenant-isolation E2E tests.

### DoD

- [ ] Full migration chain passes on PostgreSQL.
- [ ] Duplicate-role legacy fixture passes without data loss.
- [ ] Trigger scope matrix passes.
- [ ] Seed can run twice safely.
- [ ] Concurrent system-role provisioning produces one role identity.
- [ ] Concurrent rename yields one success and one HTTP 409.
- [ ] Org A cannot list Org B roles.
- [ ] Required CI checks appear and pass on the remediation commit.

---

## M-004 — Pagination DTO accepts fractional page and limit values

**Severity:** Medium  
**Category:** API validation

### Paths

```text
packages/api-identity/src/modules/access-control/presentation/roles.dto.ts
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
```

### Mô tả lỗi

`ListRolesQueryDto` uses `@IsNumber()` with `@Min()` and `@Max()`.

Values such as:

```text
?page=1.5&limit=10.5
```

are valid numbers and pass these validators, but pagination requires positive integers. Fractional values can produce invalid or surprising SQL `LIMIT`/`OFFSET` behavior.

### Giải pháp

Use:

```ts
@IsInt()
@Min(1)
```

for both page and limit, while retaining the limit maximum.

### DoD

- [ ] Fractional page returns HTTP 400.
- [ ] Fractional limit returns HTTP 400.
- [ ] Zero and negative values return HTTP 400.
- [ ] Non-numeric and non-finite values return HTTP 400.
- [ ] Valid integer values are accepted.

---

## M-005 — Unique-violation mapping is not constraint-specific

**Severity:** Medium  
**Category:** Error correctness / Diagnostics

### Paths

```text
packages/api-identity/src/modules/access-control/application/use-cases/role-management.use-case.ts
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
```

### Mô tả lỗi

Moving `23505` handling outside `transactionPort.run()` correctly avoids querying an aborted transaction.

However, the catch maps every PostgreSQL unique violation from the entire transaction to:

```text
A role with this name already exists in the organization
```

A unique violation from another operation, such as an audit constraint or an unexpected future write, would be misreported as a role-name conflict.

### Giải pháp

Inspect the PostgreSQL constraint name and only map:

```text
roles_organization_name_lower_unique
```

or the exact expected scoped role-name constraint. Rethrow unrelated `23505` errors.

### DoD

- [ ] Expected role-name uniqueness maps to HTTP 409.
- [ ] Unrelated unique violations are not mislabeled.
- [ ] Raw database details remain hidden from clients.
- [ ] Tests cover expected and unrelated `23505` constraints.

---

## I-001 — Confirmed improvements worth preserving

**Severity:** Info

- Fixed role seed lookup is platform-scope exact.
- Role authorization uses stored permission scope.
- Non-super-admin listing no longer includes other tenants' roles.
- Cross-tenant organization filters are rejected.
- Stable `(name, id)` ordering prevents page drift from duplicate names.
- Rename conflicts roll back before response mapping.
- UI does not merge distinct scoped system roles.
- Audit request context remains attached to role mutations.
- Existing delegation and system-role protections remain present.

---

# 3. Checklist tasks

## Critical

- [ ] **R3-T001:** Replace in-place duplicate `user_roles` update with canonical insert-on-conflict plus duplicate-row deletion.
- [ ] **R3-T002:** Add a PostgreSQL fixture where one user holds multiple duplicate organization system roles.
- [ ] **R3-T003:** Change `role_org_id` to `roles.organization_id%TYPE` or `uuid`.
- [ ] **R3-T004:** Add trigger execution tests for platform, matching-org, null-org, and cross-org cases.

## High

- [ ] **R3-T005:** Define explicit scope for every seeded permission.
- [ ] **R3-T006:** Remove name-based fallback scope from repository permission inserts.
- [ ] **R3-T007:** Make permission create contracts require explicit scope.
- [ ] **R3-T008:** Make unknown legacy permission backfill fail closed.
- [ ] **R3-T009:** Add permission catalog completeness tests.

## Medium

- [ ] **R3-T010:** Implement frontend pagination and server-side search/filter state.
- [ ] **R3-T011:** Add a documented paginated response DTO.
- [ ] **R3-T012:** Regenerate OpenAPI and API contracts.
- [ ] **R3-T013:** Add PostgreSQL migration/concurrency/tenant-isolation CI.
- [ ] **R3-T014:** Replace `@IsNumber()` with `@IsInt()` for page and limit.
- [ ] **R3-T015:** Map `23505` by exact constraint name.

---

# 4. Verify

## Static and unit verification

```bash
pnpm --filter @repo/api-identity lint
pnpm --filter @repo/api-identity typecheck
pnpm --filter api test
pnpm --filter admin lint
pnpm --filter admin typecheck
pnpm --filter admin test
pnpm generate:check
pnpm check
pnpm verify
```

## PostgreSQL verification

```bash
pnpm --filter api db:reset
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm --filter api db:seed
pnpm --filter api test:e2e
```

## Required database fixtures

1. Two duplicate org `ADMIN` roles with different users.
2. Two duplicate org `ADMIN` roles assigned to the same user.
3. Existing canonical assignment plus duplicate assignments.
4. Duplicate role permissions across all duplicate roles.
5. Platform and organization role scope trigger matrix.
6. Unknown legacy permission before migration `0033`.
7. Concurrent system-role provisioning.
8. Concurrent custom-role rename.
9. Two organizations exercising role-list tenant isolation.

## Round 4 acceptance

- C-001 and C-002 are fixed and demonstrated on PostgreSQL.
- Permission classification has no organization-default fallback.
- Frontend can access all paginated records.
- OpenAPI/contracts are regenerated.
- PostgreSQL integration and E2E checks are visible and passing.

---

# 5. Commit message

```text
fix(rbac): complete migration safety and explicit permission scoping

- preserve canonical assignments while merging duplicate organization roles
- make user-role scope trigger compare native UUID values
- define every permission scope explicitly and remove name-based fallbacks
- classify unknown legacy permissions fail closed
- require explicit scope for permission creation
- validate integer pagination parameters
- map role-name conflicts by exact database constraint
- add admin pagination and regenerate API contracts
- add PostgreSQL migration, concurrency, and tenant-isolation tests
```

## Handoff

- **Recommendation:** return Feature 03 to implementation.
- **Round 4 production baseline:** `63914a72391f6127237dfb051d27717635df39d4`.
- Documentation-only review commits must not be included as production remediation.
- Do not mark Feature 03 done until both migration blockers and permission fail-open behavior are fixed with PostgreSQL-backed evidence.
