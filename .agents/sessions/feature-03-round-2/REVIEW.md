# Feature 03 — Roles & Permissions / RBAC — Review Round 2

## 1. Overview findings

### Review information

- **Production baseline:** `77113b1ba7ce24032ff4ccb148bf22d495b3dda9`
- **Remediation HEAD:** `30d5cbd8d05b6ea27cb3c13947b4cbb3e89e8223`
- **Production commits reviewed:** `b880916`, `a3ca364`, `30d5cbd`
- **Verdict:** `Blocked`
- **Ready for done:** No
- **Review method:** Static diff and repository-state review. No production code changed.
- **Independent CI evidence:** None returned for remediation HEAD.

### Finding counts

| Severity | Count |
|---|---:|
| Critical | 2 |
| High | 2 |
| Medium | 3 |
| Low | 0 |
| Info / closed | 4 |

### Primary blockers

1. `0032_org_system_role_unique_and_cleanup.sql` references the `canonical` CTE from later SQL statements. PostgreSQL CTEs are statement-scoped, so migration `0032` fails before adding the unique index or completing data repair.
2. `0034_user_roles_org_consistency.sql` creates a composite foreign key to `roles(id, organization_id)`, but that referenced pair has no matching unique constraint. PostgreSQL rejects the FK.
3. The new paginated listing filter exposes fixed/system roles from other organizations to non-`SUPER_ADMIN` actors.
4. Permission scope is stored but is still not the authorization source of truth; unknown permissions continue to fail open as organization-scoped.

### Status against Round 1

| Round 1 finding | Round 2 status |
|---|---|
| C-001 seed privilege escalation | **Partially fixed** — scoped lookup fixed; repair migration is broken |
| H-001 duplicate org system role | **Not cleared** — atomic code added; required migration fails |
| M-001 permission scope fail-open | **Not fixed** |
| M-002 concurrent role conflict → 500 | **Partially fixed** — create fixed; update path still unsafe |
| M-003 UI merges scoped roles | **Fixed** |
| M-004 unbounded listing | **Partially fixed with new security regression** |
| M-005 audit request context | **Fixed** |
| M-006 real DB integration evidence | **Open** |
| L-001 misleading executor contract | **Fixed** |
| L-002 role/scope DB consistency | **Not fixed** — migration invalid and design still bypassable with NULL |
| I-001 existing controls | **Preserved by static review** |

---

## 2. Detail findings

## C-001 — Migration `0032` cannot execute because its CTE is reused across statements

**Severity:** Critical  
**Category:** Migration correctness / Availability / Data repair

### Paths

```text
apps/api/drizzle/0032_org_system_role_unique_and_cleanup.sql
```

### Mô tả lỗi

The migration defines `dupes` and `canonical` in a `WITH` clause attached to the first `UPDATE user_roles` statement. It then references `canonical` again in separate `INSERT` and `DELETE` statements after semicolons and `statement-breakpoint` markers.

PostgreSQL CTEs exist only for the single statement immediately following the `WITH`. Therefore the next statement:

```sql
INSERT INTO role_permissions ...
FROM canonical c
```

fails with `relation "canonical" does not exist`. The later delete has the same problem.

Because the migration runner executes the migration transactionally, the failure rolls back:

- duplicate-role rewiring;
- role-permission merge;
- duplicate-role deletion;
- `roles_org_system_name_unique` creation;
- defensive platform-permission cleanup.

There is a second deduplication edge case: if one user is assigned to multiple duplicate roles and not yet assigned to the canonical role, updating all source rows to one `(user_id, keep_id)` can violate the `user_roles` primary key inside the same statement.

### Giải pháp

- Materialize the duplicate map in a temporary table for the duration of the migration, or repeat the CTE in every statement.
- Prefer a safe sequence:
  1. materialize `delete_id → keep_id`;
  2. insert canonical `user_roles` rows with `ON CONFLICT DO NOTHING`;
  3. insert canonical `role_permissions` rows with `ON CONFLICT DO NOTHING`;
  4. delete duplicate roles and let cascades remove old assignments;
  5. add the unique index;
  6. run platform-permission cleanup.
- Execute the migration against a PostgreSQL fixture containing multiple duplicates and overlapping user assignments.

### DoD

- [ ] Migration `0032` applies successfully on an empty database.
- [ ] Migration applies successfully on a database with duplicate org system roles.
- [ ] A user assigned to two duplicate roles is preserved exactly once on the canonical role.
- [ ] All duplicate role permissions are preserved on the canonical role.
- [ ] Duplicate roles are removed.
- [ ] `roles_org_system_name_unique` exists after migration.
- [ ] Organization roles contain no platform permissions.
- [ ] Migration rollback leaves the pre-migration database intact when failure is injected.

---

## C-002 — Migration `0034` adds an invalid composite foreign key

**Severity:** Critical  
**Category:** Migration correctness / Database integrity

### Paths

```text
apps/api/drizzle/0034_user_roles_org_consistency.sql
packages/api-database/src/schema/identity/access-control.ts
```

### Mô tả lỗi

Migration `0034` drops the existing `user_roles.role_id → roles.id` foreign key and adds:

```sql
FOREIGN KEY (role_id, organization_id)
REFERENCES roles (id, organization_id)
```

PostgreSQL requires the complete referenced column set to be backed by a primary key, unique constraint, or suitable non-partial unique index. `roles` has a primary key only on `id`; there is no unique key on `(id, organization_id)`. The migration therefore fails with a missing matching unique constraint.

The Drizzle schema is also inconsistent with the migration:

- `userRoles.roleId` still declares the original single-column foreign key;
- no composite FK is modeled;
- no unique key on `(roles.id, roles.organizationId)` is modeled;
- the new organization-system-role unique index from migration `0032` is not modeled.

Even after adding a referenced unique pair, the default `MATCH SIMPLE` behavior does not fully satisfy L-002. If `user_roles.organization_id` is `NULL`, PostgreSQL skips the composite FK check, so an organization-scoped role can still be stored with a null assignment scope.

### Giải pháp

Use a constraint design that enforces exact null-safe equality:

- retain the normal `role_id → roles.id` FK;
- add a database trigger/check function that rejects rows unless `user_roles.organization_id IS NOT DISTINCT FROM roles.organization_id`; or
- introduce a non-null normalized scope key on both tables, such as a generated organization key using a reserved platform sentinel, then use a composite FK against a matching unique key.

Update the Drizzle schema to match every migration-level constraint and index.

### DoD

- [ ] Migration `0034` applies successfully on PostgreSQL.
- [ ] Drizzle schema exactly represents the deployed foreign keys and indexes.
- [ ] Platform role + `organization_id = NULL` is accepted.
- [ ] Organization role + matching organization is accepted.
- [ ] Organization role + `organization_id = NULL` is rejected.
- [ ] Organization role + another organization is rejected.
- [ ] Platform role + non-null organization is rejected.
- [ ] Existing invalid rows are reported and repaired according to an explicit migration policy.

---

## H-001 — Paginated role listing leaks cross-tenant system roles

**Severity:** High  
**Category:** Tenant isolation / Authorization / Data exposure

### Paths

```text
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
packages/api-identity/src/modules/access-control/application/use-cases/role-query.use-case.ts
packages/api-identity/src/modules/access-control/presentation/admin-roles.controller.ts
```

### Mô tả lỗi

For a non-`SUPER_ADMIN`, `findRolesPaginated()` adds this broad predicate:

```ts
roleNameMatch = roles.name IN FIXED_ROLE_NAMES
platformMatch = roles.organizationId IS NULL
```

and combines it with the actor-scoped predicates using `OR`.

This allows an organization admin with `roles.read` to list:

- every organization-scoped system role named `ADMIN`, including other tenants;
- every platform role, including `SUPER_ADMIN` and platform `ADMIN`;
- their permission sets through the joined role-permission query.

The caller can also provide another tenant's `organizationId`. The broad fixed-name predicate remains true for that tenant's `ADMIN`, so the supplied organization filter does not restore isolation.

This is a regression from the previous repository method, which returned only platform `USER`, the actor organization's `ADMIN`, and custom roles from the actor organization.

### Giải pháp

For non-`SUPER_ADMIN`, construct only exact allowed predicates:

```text
platform USER
OR organization ADMIN where organization_id = actor.organizationId
OR custom roles where organization_id = actor.organizationId
```

- Remove broad `FIXED_ROLE_NAMES` and `organization_id IS NULL` matches.
- Reject or ignore `organizationId` when it differs from the actor organization.
- Add E2E tests using two organizations and actors with `roles.read`.

### DoD

- [ ] Org A admin cannot list Org B roles by default.
- [ ] Org A admin cannot list Org B roles by supplying `organizationId=org-b`.
- [ ] Org admin cannot see platform `SUPER_ADMIN` or platform `ADMIN` records.
- [ ] Org admin can see platform `USER`, own org `ADMIN`, and own org custom roles.
- [ ] `SUPER_ADMIN` can filter any organization intentionally.
- [ ] Permission arrays follow the same tenant boundary.

---

## H-002 — Permission scope is not authoritative and still fails open

**Severity:** High  
**Category:** Authorization design / Privilege delegation

### Paths

```text
apps/api/drizzle/0033_permission_scope_column.sql
packages/api-database/src/schema/identity/access-control.ts
packages/api-identity/src/modules/access-control/domain/access-control-seed.catalog.ts
packages/api-identity/src/modules/access-control/application/access-control.repository.port.ts
packages/api-identity/src/modules/access-control/application/access-control.mapper.ts
packages/api-identity/src/modules/access-control/application/use-cases/role-management.use-case.ts
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
packages/api-core/src/common/rbac/platform-resources.ts
```

### Mô tả lỗi

The new `permissions.scope` column does not become the authorization source of truth:

- the column is nullable;
- it has no check constraint or enum;
- it has no fail-closed default;
- seed entries do not carry scope;
- `ensurePermissions()` does not insert scope;
- `ensureOrganizationAdminRole()` still filters with `isPlatformPermission(permission.name)`;
- `resolveCatalogPermissions()` still rejects platform permissions using the same hardcoded name classifier;
- the mapper falls back to the hardcoded classifier when scope is null.

Migration `0033` also contradicts its own comment. It says unknown permissions default to `platform`, but it sets every remaining null scope to `organization`. A newly added platform resource omitted from the four-resource hardcoded list remains delegatable to organization roles.

The database scope currently affects display output, not the security decision.

### Giải pháp

- Make scope a constrained non-null value (`platform` or `organization`).
- Default unknown/unclassified permissions to `platform`, or reject insertion without explicit scope.
- Add scope to every permission seed entry and repository creation contract.
- Use `permission.scope` in all delegation and org-admin grant policies.
- Remove the name-based fallback from authorization paths.
- Add a catalog completeness test that fails when a permission lacks explicit scope.

### DoD

- [ ] `permissions.scope` is non-null and constrained.
- [ ] Every seeded permission declares scope explicitly.
- [ ] New permission insertion without scope fails or becomes platform-scoped.
- [ ] Organization role assignment checks DB/catalog scope, not resource-name heuristics.
- [ ] Unknown resource permissions cannot be delegated to organization roles.
- [ ] A migration correctly classifies existing known permissions and fails closed for unknown rows.
- [ ] Mapper does not silently convert null/unknown scope into organization scope.

---

## M-001 — Concurrent role rename still does not reliably map to HTTP 409

**Severity:** Medium  
**Category:** Transaction behavior / API correctness

### Paths

```text
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
packages/api-identity/src/modules/access-control/application/use-cases/role-management.use-case.ts
```

### Mô tả lỗi

`createRole()` uses `ON CONFLICT DO NOTHING`, so concurrent create is substantially improved.

`updateRole()` catches SQLSTATE `23505` inside the current transaction and returns `null`. In PostgreSQL, a statement error aborts the transaction until rollback or rollback-to-savepoint. The use case then executes another `findRoleByName(..., tx)` query in that aborted transaction. That query fails with `25P02 current transaction is aborted`, preventing the intended deterministic 409 response.

The catch also treats every unique violation as a role-name conflict without checking the violated constraint.

### Giải pháp

- Let `23505` escape the transaction, allow rollback, and map the expected constraint outside `transactionPort.run()`; or
- wrap the update in a savepoint and roll back to it before performing conflict lookup; or
- serialize normalized-name changes with an advisory lock.
- Match the exact role-name constraint name before returning `RESOURCE_CONFLICT`.

### DoD

- [ ] Concurrent create produces one success and one HTTP 409.
- [ ] Concurrent rename produces one success and one HTTP 409.
- [ ] No `25P02` or raw SQL error reaches the client.
- [ ] Unrelated unique violations are not mislabeled as role-name conflicts.
- [ ] PostgreSQL-backed concurrency tests cover both create and update.

---

## M-002 — Pagination is incomplete and query parameters are not validated

**Severity:** Medium  
**Category:** API contract / UX / Input validation

### Paths

```text
packages/api-identity/src/modules/access-control/presentation/admin-roles.controller.ts
packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts
apps/admin/src/features/roles/api/roles.api.ts
apps/admin/src/features/roles/controllers/use-roles-controller.ts
apps/api/openapi.json
packages/api-contract/src/generated/index.ts
```

### Mô tả lỗi

The backend now defaults to page 1, limit 50, but the admin frontend sends no pagination parameters and has no pagination controls. Roles beyond the first 50 are silently absent from the existing page.

The changed response includes `meta`, but OpenAPI and generated contracts were not changed in the remediation diff.

Query parsing is manual and accepts invalid values:

- malformed `organizationId` reaches a UUID comparison and can cause a database error;
- arbitrary `scope` strings are cast and silently ignored;
- fractional or non-finite page values are not rejected;
- search length is unbounded;
- ordering is only by role name, which is not stable across equal names and can cause page drift.

### Giải pháp

- Create a validated query DTO with integer bounds, UUID validation, scope enum, and search length limits.
- Add deterministic ordering, e.g. `(name, id)`.
- Add frontend pagination/filter controls and preserve page state.
- Regenerate OpenAPI and API contracts.

### DoD

- [ ] Invalid UUID/scope/page/limit values return HTTP 400.
- [ ] API ordering is stable across pages.
- [ ] Frontend can navigate all result pages.
- [ ] Frontend exposes organization/search/scope filters where authorized.
- [ ] OpenAPI documents pagination query parameters and response metadata.
- [ ] Generated contracts are updated and generation checks pass.

---

## M-003 — PostgreSQL integration and CI evidence remain missing

**Severity:** Medium  
**Category:** Verification / Release confidence

### Paths

```text
apps/api/test/
packages/api-identity/src/modules/access-control/application/use-cases/__tests__/
.github/workflows/
```

### Mô tả lỗi

The reported `68 files / 333 tests` result is useful unit-regression evidence, but no new PostgreSQL-backed tests were added in the remediation diff for:

- migrations `0032`–`0034`;
- seed replay with scoped `ADMIN` roles;
- concurrent organization-role provisioning;
- concurrent role rename conflicts;
- cross-tenant paginated listing;
- null-safe `user_roles` scope enforcement.

GitHub returned no combined statuses and no workflow runs for `30d5cbd`.

The migration failures and tenant leak found in this review are exactly the class of bugs that mocked unit tests do not detect.

### Giải pháp

- Add disposable PostgreSQL CI infrastructure.
- Apply all migrations from a clean database and from a representative pre-migration fixture.
- Run seed replay and concurrency tests.
- Add RBAC E2E tenant-isolation tests.
- Make the workflow required before merge.

### DoD

- [ ] Clean migration chain passes on PostgreSQL.
- [ ] Upgrade migration fixture passes with duplicate and invalid legacy rows.
- [ ] Seed replay test passes.
- [ ] Concurrent provisioning and rename tests pass.
- [ ] Tenant-isolation listing tests pass.
- [ ] CI status is visible and successful on remediation HEAD.

---

## Closed findings confirmed by static review

### M-003 from Round 1 — UI system-role merge

- `mergeSystemRoles()` now preserves distinct role records and permission sets.
- Existing tests were updated to expect separate scoped roles.

### M-005 from Round 1 — Audit request context

- Controller captures `request.requestContext` for create, update, replace-permissions, and delete.
- Role-management audit writes receive the context.

### L-001 from Round 1 — Misleading executor parameter

- `_executor` was removed from controller-facing role-management methods.

### C-001 code path — Scoped seed lookup

- Fixed-role seed resolution now calls `findRoleByName(name, null)` explicitly.
- This code-level correction should be preserved after repairing migration `0032`.

---

## 3. Checklist tasks

### Critical

- [ ] **R2-T001:** Rewrite migration `0032` so dedupe state is available to every statement.
- [ ] **R2-T002:** Make duplicate `user_roles` rewiring conflict-safe for users assigned to multiple duplicate roles.
- [ ] **R2-T003:** Add migration tests for `0032` on clean and legacy datasets.
- [ ] **R2-T004:** Replace invalid composite FK design in migration `0034`.
- [ ] **R2-T005:** Synchronize Drizzle schema with all RBAC indexes and constraints.

### High

- [ ] **R2-T006:** Restore exact tenant-scoped role-list predicates for non-super-admin actors.
- [ ] **R2-T007:** Reject cross-tenant `organizationId` filters for organization admins.
- [ ] **R2-T008:** Add explicit non-null permission scope to seed and database contracts.
- [ ] **R2-T009:** Replace name-based scope checks in authorization policies with `permission.scope`.
- [ ] **R2-T010:** Make unknown permission scope fail closed.

### Medium

- [ ] **R2-T011:** Map concurrent update conflicts after transaction rollback or savepoint recovery.
- [ ] **R2-T012:** Validate role-list query parameters using a DTO.
- [ ] **R2-T013:** Add stable `(name, id)` pagination ordering.
- [ ] **R2-T014:** Add admin pagination and filter UI.
- [ ] **R2-T015:** Regenerate OpenAPI and API contracts.
- [ ] **R2-T016:** Add PostgreSQL migration, seed, concurrency, and tenant-isolation tests.
- [ ] **R2-T017:** Add required CI workflow/status checks.

### Regression preservation

- [ ] **R2-T018:** Preserve distinct scoped role rendering.
- [ ] **R2-T019:** Preserve audit request context.
- [ ] **R2-T020:** Preserve explicit platform seed lookup.
- [ ] **R2-T021:** Preserve existing delegation and fixed-role protections.

---

## 4. Verify

### Static and unit verification

```bash
pnpm --filter @repo/api-identity lint
pnpm --filter @repo/api-identity typecheck
pnpm --filter api test
pnpm --filter admin lint
pnpm --filter admin typecheck
pnpm --filter admin test
pnpm generate:check
```

### Migration verification

Run against a real disposable PostgreSQL instance:

```bash
pnpm --filter api db:reset
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm --filter api db:seed
```

Required assertions:

- migrations `0032`, `0033`, and `0034` apply successfully;
- a second seed run is idempotent;
- no organization role contains platform permissions;
- one organization has at most one system `ADMIN` role;
- invalid role/scope assignment rows are rejected.

### Required integration scenarios

1. Seed platform roles, create two organizations and org `ADMIN` roles, seed again.
2. Migrate legacy duplicate roles where one user belongs to multiple duplicates.
3. Run two concurrent `ensureOrganizationAdminRole()` calls.
4. Run two concurrent custom-role creates with equivalent normalized names.
5. Run two concurrent custom-role renames to the same normalized name.
6. Verify Org A admin cannot list Org B roles or platform privileged roles.
7. Verify null and mismatched organization assignments are rejected at the database boundary.
8. Verify a permission with missing/unknown scope cannot be delegated to an organization role.

### Full repository verification

```bash
pnpm check
pnpm verify
```

### CI verification

- Combined status must be present on the final remediation commit.
- PostgreSQL integration workflow must pass.
- Migration and generated-contract checks must be required.

---

## 5. Commit message

```text
fix(rbac): repair migrations and restore tenant-safe role pagination

- materialize org-role dedupe state across migration statements
- preserve assignments while merging duplicate system roles
- enforce null-safe user-role scope consistency
- align Drizzle schema with deployed RBAC constraints
- restrict non-super-admin role listing to the active organization
- make permission scope explicit, non-null, and authoritative
- map concurrent rename conflicts after transaction rollback
- validate and document paginated role queries
- add admin pagination and regenerate API contracts
- add PostgreSQL migration, concurrency, and tenant-isolation tests
```

---

## Round 3 handoff

- **Production baseline:** `30d5cbd8d05b6ea27cb3c13947b4cbb3e89e8223`
- Review only remediation commits after that SHA.
- Documentation-only review commits must not be counted as production changes.
- Do not mark Feature 03 done until migrations apply on PostgreSQL and H-001/H-002 are covered by database-backed evidence.
