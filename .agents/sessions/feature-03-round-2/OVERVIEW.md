# Feature 03 — Roles & Permissions / RBAC — Round 2 Overview

## Verdict

**Blocked**

- Production baseline: `77113b1ba7ce24032ff4ccb148bf22d495b3dda9`
- Remediation HEAD: `30d5cbd8d05b6ea27cb3c13947b4cbb3e89e8223`
- Findings: **2 Critical, 2 High, 3 Medium**

## Overview findings

### Critical blockers

1. **Migration `0032` is not executable.**
   - The `canonical` CTE is defined for one `UPDATE` statement but reused by later `INSERT` and `DELETE` statements.
   - PostgreSQL CTEs are statement-scoped, so migration fails before dedupe, unique-index creation, and permission cleanup finish.

2. **Migration `0034` adds an invalid composite FK.**
   - It references `roles(id, organization_id)` without a matching unique key.
   - Drizzle schema still models the old single-column FK.
   - Default `MATCH SIMPLE` would still allow an org role assignment with null assignment scope.

### High findings

3. **Paginated listing leaks cross-tenant system roles.**
   - Non-super-admin filtering matches every fixed role name and every platform role.
   - Org A admin can list Org B `ADMIN` records and platform privileged roles.

4. **Permission scope is not authoritative.**
   - Scope remains nullable and unconstrained.
   - Seed does not write scope.
   - Authorization still uses hardcoded resource-name classification.
   - Migration comments say unknown is platform, but SQL backfills unknown as organization.

### Medium findings

5. Concurrent create is improved, but concurrent rename can still produce an aborted PostgreSQL transaction instead of HTTP 409.
6. Backend pagination has no validated query DTO, no frontend paging, unstable ordering, and stale OpenAPI/contracts.
7. PostgreSQL integration tests and CI evidence remain missing.

## Confirmed fixes

- Fixed-role seed lookup now explicitly uses platform scope.
- Platform and organization system roles are rendered separately in the UI.
- Role mutation audits receive request context.
- Misleading controller-facing executor parameters were removed.

## Checklist summary

- [ ] Repair migration `0032`.
- [ ] Replace migration `0034` constraint design and sync Drizzle schema.
- [ ] Restore strict tenant filters in paginated listing.
- [ ] Make permission scope non-null, explicit, and authoritative.
- [ ] Correct concurrent rename conflict mapping.
- [ ] Add validated pagination DTO, frontend paging, and regenerated contracts.
- [ ] Add PostgreSQL migration/concurrency/tenant-isolation tests and required CI.

## Verify

```bash
pnpm --filter @repo/api-identity lint
pnpm --filter @repo/api-identity typecheck
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter admin test
pnpm generate:check
pnpm check
pnpm verify
```

Real PostgreSQL verification must also run the complete migration chain, seed twice, exercise legacy duplicate data, and test concurrent provisioning/renaming.

## Suggested commit message

```text
fix(rbac): repair migrations and restore tenant-safe role pagination

- materialize org-role dedupe state across migration statements
- enforce null-safe user-role scope consistency
- restrict role listing to the actor organization
- make permission scope explicit and authoritative
- map concurrent rename conflicts safely
- validate pagination and regenerate API contracts
- add PostgreSQL migration and tenant-isolation tests
```

## Artifacts

- `.agents/sessions/feature-03-round-2/REVIEW.md`
- `.agents/sessions/feature-03-round-2/OVERVIEW.md`

## Round 3 baseline

Use production commit `30d5cbd8d05b6ea27cb3c13947b4cbb3e89e8223`. Exclude documentation-only review commits from the production diff.
