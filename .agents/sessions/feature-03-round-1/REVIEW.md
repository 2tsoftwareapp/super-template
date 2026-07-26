# Feature 03 — Roles & Permissions / RBAC — Review Round 1

## Executive summary

- **Reviewed HEAD:** `77113b1ba7ce24032ff4ccb148bf22d495b3dda9`
- **Verdict:** `Blocked`
- **Ready for done:** No
- **Primary blocker:** RBAC seed resolution is not scope-safe. Once organization-level `ADMIN` roles exist, a seed rerun can select an organization role instead of the platform `ADMIN` role and attach platform permissions to it.
- **Secondary blocker:** organization-scoped system roles have no database uniqueness constraint, so concurrent admin-role provisioning can create duplicate `ADMIN` roles in one organization.
- **Review type:** static full-feature review of current `main`; no production code changed.

## Finding counts

| Severity | Count |
|---|---:|
| Critical | 1 |
| High | 1 |
| Medium | 6 |
| Low | 2 |
| Info | 1 |

## Scope reviewed

- Authorization guard and `@Authorize` semantics.
- Permission catalog and platform/organization scope classification.
- Role seed and default grant matrix.
- Custom-role create/update/delete flows.
- Organization `ADMIN` role provisioning.
- User-role assignment and organization membership synchronization.
- Access-profile resolution and invalidation.
- Roles, permissions, user-role and role-permission database schema.
- RBAC cleanup migration.
- Admin roles UI, permission picker and system-role merge behavior.
- Existing unit tests and GitHub CI evidence.

## Findings

### C-001 — RBAC seed can grant platform permissions to an organization `ADMIN`

**Severity:** Critical  
**Category:** Authorization / Tenant isolation / Privilege escalation

**Locations**

- `packages/api-identity/src/modules/access-control/infrastructure/access-control.repository.ts`
  - `ensureRoles()` inserts seed roles, then calls `findRolesByNames()`.
  - `findRolesByNames()` filters by role name only and does not constrain `organization_id IS NULL`.
- `packages/api-identity/src/modules/access-control/application/use-cases/seed-access-control.use-case.ts`
  - Builds `roleByName = new Map(roles.map(role => [role.name, role]))`.
  - Uses the selected `ADMIN` row for `replaceRolePermissions()`.
- `packages/api-core/src/common/rbac/default-role-grants.matrix.ts`
  - Platform `ADMIN` grants include `audit.read`, `jobs.*`, and `mail.*`.
- `packages/api-identity/src/modules/access-control/application/use-cases/role-management.use-case.ts`
  - Creates organization-scoped system roles also named `ADMIN`.
- `apps/api/drizzle/0018_cleanup_org_role_permissions.sql`
  - Explicitly removes `audit`, `jobs`, `mail`, and `settings` permissions from organization roles, proving these permissions must not be present there.

**Failure sequence**

1. Platform seed roles exist: `SUPER_ADMIN`, platform `ADMIN`, and `USER`.
2. At least one organization is created, producing another system role named `ADMIN` with a non-null `organization_id`.
3. Seed is run again.
4. `findRolesByNames(['SUPER_ADMIN', 'ADMIN', 'USER'])` returns the platform roles plus every organization `ADMIN` role. The query has no deterministic scope filter or ordering.
5. `new Map(... [role.name, role])` keeps only the last encountered row for each name.
6. The selected `ADMIN` may be an organization-scoped role.
7. `replaceRolePermissions()` writes the full platform `ADMIN` permission matrix onto that organization role.
8. Users holding that role receive platform permission strings through normal access-profile resolution and can pass `AuthorizeGuard` checks for those permissions.

This also reintroduces data that migration `0018` intentionally removed.

**Required fix**

- Replace `ensureRoles()` seed lookup with an explicitly platform-scoped repository operation, for example:
  - `findRoleByName(name, null, tx)` for each fixed role, or
  - `findPlatformRolesByNames()` with `organization_id IS NULL`.
- Never key roles by name alone when multiple scopes can contain the same name.
- Add a forward data-repair migration that removes platform permissions from every organization-scoped role again.
- Add a PostgreSQL integration test:
  1. seed platform RBAC;
  2. create two organizations and their `ADMIN` roles;
  3. rerun seed;
  4. assert only platform `ADMIN` has platform permissions;
  5. assert every organization `ADMIN` excludes them.

---

### H-001 — Organization system roles are not unique and provisioning is race-prone

**Severity:** High  
**Category:** Concurrency / Data integrity

**Locations**

- `packages/api-database/src/schema/identity/access-control.ts`
  - Platform role names are unique only where `organization_id IS NULL`.
  - Organization role-name uniqueness applies only where `is_system = false`.
  - No unique constraint covers organization-scoped system roles.
- `packages/api-identity/src/modules/access-control/application/use-cases/role-management.use-case.ts`
  - `ensureOrganizationAdminRole()` performs `findRoleByName()` followed by `createRole()`.

Two transactions provisioning `ADMIN` for the same organization can both observe no row and both insert a system `ADMIN`. This creates multiple role identities with the same organization/name, produces inconsistent assignments and makes C-001 more likely and less deterministic.

**Required fix**

- Add a cleanup migration that selects one canonical organization `ADMIN`, rewires `user_roles` and `role_permissions`, and deletes duplicates.
- Add a partial unique index such as:

```sql
CREATE UNIQUE INDEX roles_org_system_name_lower_unique
ON roles (organization_id, LOWER(name))
WHERE is_system = true AND organization_id IS NOT NULL;
```

- Implement provisioning with database conflict handling/upsert and then fetch the exact scoped role.
- Add a real concurrent PostgreSQL test asserting one role row and one stable role ID.

---

### M-001 — Permission scope classification fails open for new resources

**Severity:** Medium  
**Category:** Authorization design

`isPlatformPermission()` treats only four hardcoded resources as platform-scoped: `settings`, `audit`, `mail`, and `jobs`. Every unknown resource defaults to organization scope.

A future platform permission such as `billing.update` or `tenants.delete` becomes delegatable to organization roles unless a developer remembers to update this separate list. This authorization boundary is not enforced by the permission catalog or database.

**Recommendation**

- Store explicit permission scope in the catalog/schema, or default unknown resources to platform scope.
- Add a test that every seeded permission has an explicit, expected scope.
- Add a policy test preventing platform controllers from using an unclassified permission resource.

---

### M-002 — Concurrent duplicate role creation/update can return an internal error

**Severity:** Medium  
**Category:** API correctness / Concurrency

Custom-role create/update uses a read-before-write duplicate check. The database has the final unique constraint, but SQLSTATE `23505` is not translated into the documented `RESOURCE_CONFLICT` response.

Two concurrent requests with the same normalized name can both pass the application check; one receives a raw database error instead of a deterministic HTTP 409.

**Recommendation**

- Catch and map the scoped role-name unique violation to `RESOURCE_CONFLICT`.
- Prefer conflict-aware insert/update patterns where practical.
- Add concurrent create and rename integration tests.

---

### M-003 — Admin UI merges system roles whose permission sets are intentionally different

**Severity:** Medium  
**Category:** UI correctness / Operator visibility

`mergeSystemRoles()` merges all roles with the same name and keeps the first permission set. Its comment and test claim the permission sets are identical across scopes. They are not:

- platform `ADMIN` receives the full default matrix;
- organization `ADMIN` intentionally excludes platform permissions.

The backend orders roles only by `name`, so the first `ADMIN` among equal names is not a stable scope selection. The UI can therefore display either platform or organization permissions while showing a combined `platform` + `organization` badge.

**Recommendation**

- Do not collapse system roles across organization identity.
- Render platform role and organization-role instances separately, or group them with explicit children and scoped permission sets.
- Replace the existing test that codifies the incorrect “identical across scopes” assumption.

---

### M-004 — SUPER_ADMIN role listing is unbounded across all tenants

**Severity:** Medium  
**Category:** Scalability / Availability

`RoleQueryUseCase.listRoles()` loads every role for `SUPER_ADMIN`, then loads all permissions for all returned role IDs. The admin UI also loads organizations to label custom roles. There is no organization filter, pagination, limit or lazy detail fetch.

As tenants and custom roles grow, one roles-page request can produce a large database query, response and client render, impacting the platform-admin path.

**Recommendation**

- Add pagination and organization/search filters.
- Separate the small platform system-role catalog from tenant custom-role listing.
- Fetch permission details lazily or in a bounded page.

---

### M-005 — Role CRUD audit records lack request context

**Severity:** Medium  
**Category:** Audit / Forensics

Role create, update and delete are audited in the same database transaction, which is good. However, the controller/use-case signatures do not pass `RequestContext`, so these privileged changes omit available forensic context such as request correlation, IP and user agent.

**Recommendation**

- Capture the standard request context in `AdminRolesController`.
- Pass it into role-management commands and `auditWriter.log()`.
- Test that role mutation audit records contain scope, actor, target and request context.

---

### M-006 — Security-critical seed and concurrency paths lack database integration evidence

**Severity:** Medium  
**Category:** Testing / Verification

Existing role-management tests mock the repository and transaction port. They do not exercise:

- seed behavior with both platform and organization roles sharing `ADMIN`;
- actual partial unique indexes;
- concurrent organization-admin provisioning;
- concurrent custom-role naming conflicts;
- end-to-end authorization after permission changes.

GitHub returned no combined status checks and no workflow runs for reviewed HEAD `77113b1`.

**Recommendation**

Add PostgreSQL-backed integration tests and an E2E authorization matrix, then make the relevant CI workflow required.

---

### L-001 — Role-management methods advertise an executor they ignore

**Severity:** Low  
**Category:** Transaction contract

`createCustomRole()`, `updateCustomRole()` and `deleteCustomRole()` accept `_executor?: TransactionExecutor` but always open a new transaction through `transactionPort.run()`.

This is harmless for the current controller-only call path, but the signature implies safe participation in an outer transaction when that is not true.

**Recommendation**

- Remove the executor parameter, or
- execute the operation with the supplied executor and only create a transaction when none is provided.

---

### L-002 — `user_roles` does not enforce role/scope consistency at the database boundary

**Severity:** Low  
**Category:** Defense in depth / Data integrity

`user_roles` stores both `role_id` and `organization_id`, but the database does not guarantee that `user_roles.organization_id` equals `roles.organization_id`. Current application paths generally insert matching values, but a future repository bug, migration or manual operation can produce a cross-scope assignment row.

**Recommendation**

Introduce a database-enforceable scoped identity design, such as a composite role key/reference or a trigger constraint, and add an integrity test.

---

### I-001 — Existing controls worth preserving

**Severity:** Info

The following controls are strong and should remain:

- `AuthorizeGuard` requires all declared permissions and supports explicit role requirements.
- `SUPER_ADMIN` bypass is centralized rather than repeated in controllers.
- Organization admins cannot delegate permissions they do not currently hold.
- Platform permissions are rejected for organization custom roles.
- Fixed/system role names cannot be reused by custom roles.
- Role create/update/delete and audit writes share one transaction.
- Delete uses `SELECT ... FOR UPDATE` before checking assignments.
- Role permission changes invalidate affected access profiles.
- Admin UI filters the permission picker to organization-scoped, delegatable permissions.

## Verification status

| Check | Result |
|---|---|
| Static backend review | Completed |
| Static schema/migration review | Completed |
| Static admin frontend review | Completed |
| Existing unit-test review | Completed |
| PostgreSQL integration execution | Not available through connector |
| GitHub combined statuses | None returned |
| GitHub workflow runs for HEAD | None returned |

## Required remediation order

1. **C-001:** make seed lookups platform-scope exact and repair corrupted organization-role grants.
2. **H-001:** deduplicate organization system roles and add a partial unique constraint/upsert.
3. Add seed-replay and concurrent-provisioning PostgreSQL tests.
4. Correct system-role UI representation.
5. Harden explicit permission scope classification.
6. Map unique violations to deterministic conflict responses.
7. Add pagination/filtering, audit request context and required CI evidence.

## Minimum tests for Round 2

1. Seed rerun with platform `ADMIN` plus multiple organization `ADMIN` roles never mutates organization grants.
2. Two concurrent `ensureOrganizationAdminRole()` calls produce exactly one scoped role.
3. Org `ADMIN` never contains `settings.*`, `audit.*`, `mail.*`, or `jobs.*`.
4. Concurrent custom-role creates with equivalent normalized names produce one success and one HTTP 409.
5. Platform and organization `ADMIN` display distinct scoped permission sets in the admin UI.
6. Role create/update/delete audit records include request context.
7. Permission classification test fails when a catalog permission has no explicit scope declaration.

## Handoff

- **Recommendation:** return Feature 03 to implementation.
- **Round 2 baseline:** use `77113b1ba7ce24032ff4ccb148bf22d495b3dda9` plus only the Feature 03 remediation commits.
- **Do not mark done** until C-001 and H-001 are repaired with data migrations and PostgreSQL-backed evidence.
