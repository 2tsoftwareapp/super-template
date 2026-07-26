# Feature 03 — Roles & Permissions / RBAC — Round 1 Overview

## Verdict

**Blocked**

Reviewed production HEAD: `77113b1ba7ce24032ff4ccb148bf22d495b3dda9`

## Counts

- Critical: 1
- High: 1
- Medium: 6
- Low: 2
- Info: 1

## Primary blockers

### C-001 — Seed can grant platform permissions to an organization `ADMIN`

The seed queries roles by name without constraining platform scope, then stores them in a `Map` keyed only by role name. Once organization-level `ADMIN` roles exist, a seed rerun can select one of them as the default `ADMIN` and attach the full platform grant matrix, including `audit`, `jobs`, and `mail` permissions.

Required:

- resolve fixed seed roles with `organization_id IS NULL`;
- repair existing organization-role grants;
- add a seed-replay PostgreSQL integration test.

### H-001 — Organization system `ADMIN` roles are not unique

The schema has no unique index covering organization-scoped system roles. Concurrent provisioning can create duplicate `ADMIN` role identities in the same organization.

Required:

- deduplicate existing rows and rewire assignments;
- add a partial unique index for organization system-role names;
- use conflict-safe provisioning and add a concurrency test.

## Important follow-ups

- Make permission scope explicit instead of treating unknown resources as organization-scoped.
- Map concurrent role-name unique violations to HTTP 409.
- Stop merging platform and organization `ADMIN` into one UI item with an arbitrary permission set.
- Add pagination/filtering for SUPER_ADMIN role listing.
- Include request context in role mutation audit records.
- Add PostgreSQL integration/E2E coverage and required CI checks.

## Artifacts

- `.agents/sessions/feature-03-round-1/REVIEW.md`
- `.agents/sessions/feature-03-round-1/OVERVIEW.md`

## Next review

Round 2 should compare from production baseline `77113b1` to the Feature 03 remediation head. Documentation-only review commits must not be included as production changes.
