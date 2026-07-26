# Feature 03 — Roles & Permissions / RBAC — Round 3 Overview

## Verdict

**Blocked**

Reviewed remediation range:

```text
30d5cbd8d05b6ea27cb3c13947b4cbb3e89e8223..63914a72391f6127237dfb051d27717635df39d4
```

## Counts

- Critical: 2
- High: 1
- Medium: 5
- Low: 0
- Info: 1

## Confirmed fixes

- Fixed role seed lookup is platform-scope exact.
- Role pagination is tenant-restricted for non-super-admin actors.
- Cross-tenant organization filters are rejected.
- Authorization reads stored permission scope.
- Rename uniqueness errors roll back before HTTP 409 mapping.
- Pagination ordering is stable by role name and ID.
- Existing UI role separation and audit request context remain intact.

## Primary blockers

### C-001 — Duplicate assignment rewiring can violate the primary key

Migration `0032` now uses a temp table correctly, but it updates all duplicate assignments in place. If one user holds two duplicate role IDs and no canonical assignment, both rows are updated to the same `(user_id, canonical_role_id)` key and the migration aborts.

Required:

- insert canonical assignments with `ON CONFLICT DO NOTHING`;
- delete duplicate assignment rows afterward;
- add a PostgreSQL legacy fixture for one user holding multiple duplicate roles.

### C-002 — Scope trigger compares UUID to text

Migration `0034` declares `role_org_id text` and compares it with UUID `NEW.organization_id`. Trigger execution can fail on normal role assignment.

Required:

- use `roles.organization_id%TYPE` or `uuid`;
- execute a complete null-safe scope matrix on PostgreSQL.

### H-001 — Permission classification still fails open

Although stored DB scope is now used by authorization, seed and repository insertion still infer scope using the same four-resource name heuristic. Unknown permissions default to organization scope, and migration `0033` backfills unrecognized legacy permissions as organization-scoped.

Required:

- explicit scope for every permission;
- no name-based fallback in repository or seed;
- unknown legacy permissions fail closed;
- catalog completeness tests.

## Remaining medium work

- Add frontend pagination and server-side search/filter handling.
- Document and regenerate paginated OpenAPI/contracts.
- Add PostgreSQL migration, concurrency, and tenant-isolation CI.
- Require integer page and limit values.
- Map `23505` only for the expected role-name constraint.

## CI evidence

No combined status checks or workflow runs were available for remediation HEAD `63914a7`.

## Artifacts

- `.agents/sessions/feature-03-round-3/REVIEW.md`
- `.agents/sessions/feature-03-round-3/OVERVIEW.md`

## Next review

Round 4 should compare production baseline `63914a72391f6127237dfb051d27717635df39d4` to the next remediation HEAD. Documentation-only review commits must be excluded from production changes.
