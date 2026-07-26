# Feature 03 — Roles & Permissions / RBAC — Review Round 4

## 1. Overview findings

- **Production baseline:** `63914a72391f6127237dfb051d27717635df39d4`
- **Remediation HEAD:** `2690815e58d2acd632f120d8dc14fdf9d963de6d`
- **Verdict:** `Blocked`
- **Ready for done:** No
- **Review type:** static remediation review; no production code changed by this review

### Finding counts

| Severity | Count |
|---|---:|
| Critical | 1 |
| High | 1 |
| Medium | 4 |
| Low | 1 |
| Info | 1 |

### Confirmed remediations

- Migration `0032` now materializes the duplicate-role mapping and preserves canonical user assignments with insert-on-conflict before deleting duplicate assignments.
- Migration `0034` now compares native UUID values in the role-scope trigger.
- Role-name `23505` mapping occurs outside the failed transaction and is restricted to `roles_organization_name_lower_unique`.
- Pagination DTO now requires integer page and limit values.
- Tenant-safe role-list filtering from Round 3 remains intact.
- The admin page now renders pagination controls, but the implementation is still client-side over the first backend page.

### Primary blocker

Migration `0033_permission_scope_column.sql` classifies every existing permission whose new `scope` column is null as `platform`. Since all existing rows start with null after the column is added, all organization permissions such as `users.*`, `roles.*`, `files.*`, and `notifications.*` become platform permissions during an upgrade. The seed uses `ON CONFLICT DO NOTHING`, so it does not repair those rows.

This breaks organization role management and can leave newly classified platform permissions attached to organization roles.

---

## 2. Detail findings

### C-001 — Permission-scope migration corrupts existing organization permissions

**Severity:** Critical  
**Category:** Migration / Authorization / Upgrade safety

#### Paths

```text
apps/api/drizzle/0033_permission_scope_column.sql
apps/api/drizzle/0032_org_system_role_unique_and_cleanup.sql
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
packages/api-identity/src/modules/access-control/application/use-cases/role-management.use-case.ts
packages/api-identity/src/modules/access-control/application/use-cases/role-query.use-case.ts
```

#### Mô tả lỗi

Migration `0033` performs these operations:

```sql
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS scope text;

UPDATE permissions
SET scope = 'platform'
WHERE resource is one of settings/audit/mail/jobs;

UPDATE permissions
SET scope = 'platform'
WHERE scope IS NULL;
```

On an existing database, every permission initially receives `scope = NULL`. The second update therefore classifies every non-platform permission as platform too.

Examples affected:

```text
users.read
users.create
roles.read
roles.update
notifications.read
files.read
attachments.create
imports.update
exports.create
activities.read
```

The seed cannot repair this because `ensurePermissions()` inserts with `ON CONFLICT DO NOTHING`; existing permission rows retain the incorrect scope.

Runtime impact:

1. Non-super-admin permission catalog queries filter out platform permissions, so organization admins receive an empty or severely incomplete permission picker.
2. `ensureOrganizationAdminRole()` filters out every permission whose scope is platform, then replaces the organization `ADMIN` role permission set. It can therefore replace the role with zero permissions.
3. Custom role create/update rejects all incorrectly classified permissions as platform-scoped.
4. Unknown legacy permissions are changed to platform, but migration `0032` only removed known platform prefixes before `scope` existed. Existing organization roles may therefore remain linked to permissions that are now classified as platform.
5. Runtime permission resolution reads permission names from existing role assignments without filtering by permission scope, so those stale assignments remain authorization-relevant.

#### Giải pháp

- Backfill all currently known organization permission resources explicitly as `organization`.
- Backfill all currently known platform resources explicitly as `platform`.
- Only after both explicit sets are applied, classify genuinely unknown legacy permissions as `platform`.
- After scope classification, remove all `role_permissions` rows where:
  - the role is organization-scoped; and
  - the permission is platform-scoped.
- Make seed reconciliation update the scope of existing system permissions, for example with `ON CONFLICT (name) DO UPDATE SET scope = EXCLUDED.scope`, or provide a dedicated repair step.
- Add a PostgreSQL upgrade fixture containing the complete pre-0033 permission catalog and custom legacy permissions.

#### DoD

- [ ] Existing `users.*`, `roles.*`, `notifications.*`, `files.*`, `attachments.*`, `imports.*`, `exports.*`, and `activities.*` rows become `organization`.
- [ ] Existing `settings.*`, `audit.*`, `mail.*`, and `jobs.*` rows become `platform`.
- [ ] Unknown legacy permission names become `platform`.
- [ ] No organization role remains linked to a platform permission after migration.
- [ ] Seed replay repairs or verifies the scope of existing system permissions.
- [ ] Organization `ADMIN` retains the expected organization permission matrix after upgrade and seed replay.
- [ ] Permission picker remains populated for organization admins.
- [ ] PostgreSQL upgrade test passes with both standard and unknown legacy permissions.

---

### H-001 — Seed scope classification still fails open for new resources

**Severity:** High  
**Category:** Authorization design / Future privilege escalation

#### Paths

```text
packages/api-identity/src/modules/access-control/domain/access-control-seed.catalog.ts
packages/api-core/src/common/rbac/platform-resources.ts
packages/api-core/src/common/rbac/default-role-grants.matrix.ts
```

#### Mô tả lỗi

`PERMISSION_SEED_ENTRIES` still derives scope from the permission-name resource prefix:

```ts
return PLATFORM_SCOPE_CATALOG.has(resource)
  ? 'platform'
  : 'organization';
```

The central list is cleaner than duplicated repository heuristics, but the authorization boundary still defaults every unlisted resource to organization scope.

A future platform resource such as:

```text
billing.update
tenants.delete
feature-flags.update
platform-config.manage
```

will become delegatable to organization roles if the developer adds it to the grants/catalog but forgets to update `PLATFORM_RESOURCES`.

The commit states that every permission scope is explicit, but scope is still inferred from resource membership rather than declared alongside each catalog entry.

#### Giải pháp

Use one authoritative permission catalog where each permission or resource declares its scope explicitly, for example:

```ts
{
  resource: 'audit',
  scope: 'platform',
  actions: [ACTION.READ],
}
```

Requirements:

- No default to organization scope.
- Unclassified resources must fail typecheck/test/bootstrap or default to platform.
- Generate role grants and seed entries from the same scoped catalog.
- Add a completeness test that every generated permission has exactly one declared scope.

#### DoD

- [ ] Scope is declared in the authoritative permission catalog.
- [ ] Seed scope is not inferred from a permission-name prefix.
- [ ] A new unclassified resource causes test/bootstrap failure.
- [ ] No resource silently defaults to organization scope.
- [ ] Role grants and permission seed entries derive from the same scoped source.
- [ ] Catalog completeness test covers every seeded permission.

---

### M-001 — Admin pagination only paginates the first backend page

**Severity:** Medium  
**Category:** Frontend correctness / Pagination

#### Paths

```text
apps/admin/src/features/roles/api/roles.api.ts
apps/admin/src/features/roles/api/roles.queries.ts
apps/admin/src/features/roles/controllers/use-roles-controller.ts
apps/admin/src/features/roles/ui/roles-list-view.tsx
```

#### Mô tả lỗi

The UI now renders a pagination component, but the API call remains:

```ts
rolesApi.list()
```

It does not send `page`, `limit`, `organizationId`, `scope`, or `search`.

The backend defaults to a maximum first page of 50 roles. The controller then performs another client-side pagination step:

```ts
filteredCustom.slice(start, start + 20)
```

Consequences:

- Roles after backend page 1 remain inaccessible.
- Search only scans the first backend page.
- The displayed total counts only custom roles received in the first response, not `meta.total` from the server.
- System roles consume part of the backend page, so fewer than 50 custom roles may be available to the client.

#### Giải pháp

- Change `rolesApi.list(params)` to send backend query parameters.
- Include params in the React Query key.
- Read and use server `meta.total` and `meta.totalPages`.
- Move search and scope/organization filtering to the backend request.
- Reset page to 1 when filters change.
- Optionally keep only presentation-level grouping client-side, not data pagination.

#### DoD

- [ ] UI can navigate to every backend page.
- [ ] Search finds roles outside the first page.
- [ ] Scope and organization filters are server-driven.
- [ ] Query key includes page, limit, search, scope, and organization ID.
- [ ] Displayed total comes from server metadata.
- [ ] Frontend tests cover more than 50 roles and server page transitions.

---

### M-002 — Paginated runtime response does not match its Swagger schema

**Severity:** Medium  
**Category:** API contract / OpenAPI

#### Paths

```text
packages/api-identity/src/modules/access-control/presentation/admin-roles.controller.ts
packages/api-core/src/common/decorators/api-response.decorator.ts
apps/api/openapi.json
packages/api-contract/src/generated/index.ts
```

#### Mô tả lỗi

`@ApiPaginatedResponse(RoleDto)` documents pagination metadata with:

```text
page
limit
total
totalPages
requestId
```

The roles controller returns:

```ts
meta: {
  total,
  page,
  limit,
}
```

It omits `totalPages`, while the Swagger schema marks it as part of `PaginationMetaDto`.

The remediation range also does not contain regenerated `apps/api/openapi.json` or `packages/api-contract/src/generated/index.ts`. The admin API continues using a manually typed `ListResponse` instead of the generated roles-list operation type.

#### Giải pháp

- Return `totalPages: Math.ceil(total / limit)` from the controller.
- Regenerate OpenAPI and API contracts.
- Consume the generated paginated roles response type in the admin API.
- Run `pnpm generate:check` in CI.

#### DoD

- [ ] Runtime meta contains `totalPages`.
- [ ] Runtime response matches `ApiPaginatedResponse` schema.
- [ ] Query parameters and paginated response appear in `openapi.json`.
- [ ] Generated API contract is updated.
- [ ] Admin client uses generated response types.
- [ ] `pnpm generate:check` passes.

---

### M-003 — Database CHECK constraint is absent from the Drizzle schema

**Severity:** Medium  
**Category:** Schema drift / Database maintainability

#### Paths

```text
apps/api/drizzle/0033_permission_scope_column.sql
packages/api-database/src/schema/identity/access-control.ts
```

#### Mô tả lỗi

The raw migration adds:

```sql
CHECK (scope IN ('platform', 'organization'))
```

The Drizzle schema only declares:

```ts
scope: text('scope').notNull()
```

The source schema therefore does not model the deployed CHECK constraint. Future schema generation or maintenance can miss or drift from this authorization invariant.

#### Giải pháp

- Add a Drizzle `check()` declaration for permission scope, or use a PostgreSQL enum represented by the schema.
- Ensure generated migration checks do not attempt to drop or duplicate the constraint.

#### DoD

- [ ] Drizzle schema models the permitted scope values.
- [ ] `db:generate` reports no unintended scope-constraint drift.
- [ ] Invalid scope insert is rejected by PostgreSQL.
- [ ] Schema-level test verifies both accepted values and invalid rejection.

---

### M-004 — PostgreSQL integration and CI evidence are still missing

**Severity:** Medium  
**Category:** Verification / CI

#### Paths

```text
apps/api/test/
.github/workflows/
apps/api/drizzle/0032_org_system_role_unique_and_cleanup.sql
apps/api/drizzle/0033_permission_scope_column.sql
apps/api/drizzle/0034_user_roles_org_consistency.sql
```

#### Mô tả lỗi

No database-backed test files were added in the remediation range. GitHub exposes no combined status checks and no workflow runs for remediation HEAD.

Static review cannot prove:

- migration syntax and upgrade behavior;
- duplicate-role assignment preservation;
- trigger execution for all null/mismatch cases;
- seed replay against existing rows;
- concurrent provisioning and rename behavior;
- tenant-isolated pagination against real data.

#### Giải pháp

Add a disposable PostgreSQL service to CI and run migration, seed-replay, concurrency, and tenant-isolation suites as required checks.

#### DoD

- [ ] Clean migration chain passes on PostgreSQL.
- [ ] Legacy upgrade fixture passes.
- [ ] Duplicate-role/user-assignment fixture passes.
- [ ] Permission-scope backfill fixture passes.
- [ ] Trigger matrix passes.
- [ ] Seed replay passes twice.
- [ ] Concurrency tests pass.
- [ ] GitHub required checks are visible and successful.

---

### L-001 — Permission DTO does not expose the now-required scope

**Severity:** Low  
**Category:** Dead contract / Type consistency

#### Paths

```text
packages/api-identity/src/modules/access-control/presentation/roles.dto.ts
packages/api-identity/src/modules/access-control/application/access-control.repository.port.ts
```

#### Mô tả lỗi

`CreatePermissionValues.scope` is now required at the repository boundary, but `CreatePermissionDto` still contains only `name` and `description`.

The DTO currently appears unused by a controller, so this is not an active runtime path. It remains a misleading contract that will fail or encourage a scope-less API path if reused.

#### Giải pháp

- Remove unused permission mutation DTOs if runtime permission creation is intentionally unsupported; or
- add required validated scope and wire the full use case consistently.

#### DoD

- [ ] Unsupported dead DTOs are removed, or scope is required and validated.
- [ ] No permission creation path can omit scope.
- [ ] OpenAPI does not advertise an unusable DTO.

---

### I-001 — Round 3 remediation controls worth preserving

**Severity:** Info

The following changes are correct and should remain:

- canonical user assignments are inserted with conflict handling before duplicate assignment deletion;
- trigger scope comparison uses UUID;
- unknown legacy permission scope defaults to platform rather than organization;
- repository permission inserts require a scope;
- concurrent rename conflict mapping is outside the transaction and constraint-specific;
- page and limit validation require integers;
- tenant-safe role filtering remains enforced;
- Swagger uses a paginated response decorator.

---

## 3. Checklist tasks

### Critical

- [ ] **R4-T001:** Explicitly backfill all known organization permission resources in migration `0033`.
- [ ] **R4-T002:** Keep unknown legacy permissions fail-closed as platform.
- [ ] **R4-T003:** Remove all platform-permission assignments from organization roles after scope backfill.
- [ ] **R4-T004:** Reconcile existing system permission scopes during seed or migration.
- [ ] **R4-T005:** Add an existing-database upgrade fixture for `0033`.

### High

- [ ] **R4-T006:** Replace prefix-based seed classification with an authoritative scoped permission catalog.
- [ ] **R4-T007:** Make unclassified resources fail bootstrap/test.
- [ ] **R4-T008:** Add permission-catalog completeness tests.

### Medium

- [ ] **R4-T009:** Implement server-driven admin role pagination.
- [ ] **R4-T010:** Move search/scope/organization filters into API requests.
- [ ] **R4-T011:** Return `totalPages` from the roles controller.
- [ ] **R4-T012:** Regenerate OpenAPI and API contracts.
- [ ] **R4-T013:** Model the permission-scope CHECK in Drizzle schema.
- [ ] **R4-T014:** Add PostgreSQL integration tests and required CI checks.

### Low

- [ ] **R4-T015:** Remove dead permission mutation DTOs or require validated scope.

---

## 4. Verify

### Static and unit checks

```bash
pnpm --filter @repo/api-identity lint
pnpm --filter @repo/api-identity typecheck
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter admin lint
pnpm --filter admin typecheck
pnpm --filter admin test
pnpm generate:check
pnpm check
pnpm verify
```

### PostgreSQL migration verification

```bash
pnpm --filter api db:reset
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm --filter api db:seed
```

### Required upgrade fixtures

1. Existing permission catalog with all standard organization and platform permissions and no scope column.
2. Unknown legacy permission assigned to an organization custom role.
3. Existing organization `ADMIN` role with expected organization grants.
4. Same user assigned to multiple duplicate organization system roles.
5. Existing canonical assignment plus duplicate assignments.
6. Platform role with null assignment scope.
7. Organization role with matching, null, and wrong organization scope.
8. More than 50 roles across multiple organizations.
9. Concurrent organization-admin provisioning.
10. Concurrent custom-role rename.

### Acceptance for Round 5

- Migration `0033` preserves the correct scope for all existing standard permissions.
- Organization roles contain no platform permissions after migration.
- Seed and migration use one authoritative scope catalog.
- Admin pagination reaches records beyond backend page 1.
- OpenAPI/contracts match runtime.
- PostgreSQL integration and CI checks pass.

---

## 5. Commit message

```text
fix(rbac): repair permission scope upgrades and finish paginated role management

- backfill known organization and platform permission scopes explicitly
- classify unknown legacy permissions as platform and remove org assignments
- reconcile existing system permission scopes during seed replay
- replace prefix inference with an authoritative scoped permission catalog
- implement server-driven role pagination and filtering in admin
- return complete pagination metadata and regenerate API contracts
- model permission scope constraints in the Drizzle schema
- add PostgreSQL migration, concurrency, and tenant-isolation tests
```

## Handoff

- **Recommendation:** return Feature 03 to implementation.
- **Round 5 baseline:** `2690815e58d2acd632f120d8dc14fdf9d963de6d` plus only Feature 03 remediation commits.
- Do not include documentation-only review commits in the production comparison.
