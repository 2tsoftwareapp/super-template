# Feature 03 — Roles & Permissions / RBAC — Round 4 Overview

## 1. Overview findings

- **Production baseline:** `63914a72391f6127237dfb051d27717635df39d4`
- **Remediation HEAD:** `2690815e58d2acd632f120d8dc14fdf9d963de6d`
- **Verdict:** **Blocked**
- **Counts:** `1 Critical · 1 High · 4 Medium · 1 Low · 1 Info`

### Confirmed fixed

- Duplicate role assignments are preserved through canonical insert-on-conflict.
- User-role scope trigger compares UUID values.
- Rename conflicts are mapped outside the failed transaction and by exact constraint.
- Page/limit require integers.
- Tenant-safe backend role filtering remains correct.

### Primary blocker

Migration `0033_permission_scope_column.sql` sets every existing permission whose new scope is null to `platform`. Since all pre-existing permissions initially have null scope, standard organization permissions also become platform-scoped.

Seed replay does not repair them because permission inserts use `ON CONFLICT DO NOTHING`.

Impact:

- organization permission picker can become empty;
- organization `ADMIN` provisioning can replace grants with an empty set;
- custom roles cannot assign standard organization permissions;
- unknown legacy permissions can remain attached to organization roles after becoming platform-scoped.

## 2. Findings

### C-001 — Permission-scope upgrade migration corrupts existing organization permissions

Required:

- explicitly backfill known organization permissions;
- explicitly backfill known platform permissions;
- default only genuinely unknown legacy permissions to platform;
- remove all platform-permission assignments from organization roles;
- reconcile existing system permission scopes during seed replay;
- add PostgreSQL upgrade tests.

### H-001 — Seed classification still defaults unlisted resources to organization scope

`PERMISSION_SEED_ENTRIES` still infers scope from `PLATFORM_RESOURCES`. Any future platform resource omitted from that list becomes organization-delegatable.

Required:

- define scope in one authoritative permission catalog;
- remove organization-scope defaulting;
- fail test/bootstrap for unclassified resources.

### Medium follow-ups

- Admin pagination is client-side over the first backend page only.
- Roles response omits `totalPages` despite using `ApiPaginatedResponse`.
- OpenAPI and generated contracts were not regenerated.
- The Drizzle schema does not model `permissions_scope_check`.
- PostgreSQL integration tests and CI evidence remain unavailable.

### Low follow-up

`CreatePermissionDto` does not expose the scope now required by the repository contract. Remove the unused DTO or require validated scope.

## 3. Checklist tasks

- [ ] Repair `0033` backfill for standard organization permissions.
- [ ] Remove platform permissions from all organization roles after classification.
- [ ] Reconcile existing permission scope during seed replay.
- [ ] Replace prefix inference with a scoped permission catalog.
- [ ] Add server-driven admin role pagination and filters.
- [ ] Return `totalPages` and regenerate OpenAPI/contracts.
- [ ] Model the scope CHECK in Drizzle.
- [ ] Add PostgreSQL migration, concurrency, and tenant-isolation tests.

## 4. Verify

```bash
pnpm --filter api db:reset
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm --filter api db:seed
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter admin test
pnpm generate:check
pnpm check
pnpm verify
```

Round 5 must include an existing-database permission upgrade fixture and roles beyond backend page 1.

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

## Next review

Use production baseline `2690815e58d2acd632f120d8dc14fdf9d963de6d`. Exclude documentation-only Round 4 commits from production changes.
