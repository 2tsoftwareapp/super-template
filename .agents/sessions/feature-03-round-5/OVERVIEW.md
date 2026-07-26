# Feature 03 — Roles & Permissions / RBAC — Round 5 Overview

## Verdict

**Blocked**

- Reviewed range: `2690815e58d2acd632f120d8dc14fdf9d963de6d..3c9663b862aceeb27d49ed677d7b20d18209b6e8`
- Remediation HEAD: `3c9663b862aceeb27d49ed677d7b20d18209b6e8`
- Findings: **1 Critical, 4 Medium, 2 Low, 1 Info**

## What cleared

- Fresh migration `0033` now separates known organization and platform permissions.
- Unknown legacy permissions fail closed to platform.
- Fresh migration cleanup removes platform permissions from organization roles.
- Seed reconciles existing seeded permission scopes.
- Drizzle models the scope CHECK constraint.
- Admin now uses server-driven pagination/search parameters.
- Runtime pagination metadata includes `totalPages`.

## Main blocker

The migration runner records applied migrations by filename and skips files already present in `public.__app_migrations`.

The remediation edits `0033_permission_scope_column.sql` instead of adding a new forward migration. Any database that already ran the old `0033` will not execute the repaired SQL and may retain organization permissions incorrectly marked as platform.

A new migration after `0034` must repair existing non-NULL scope values and remove invalid platform grants from organization roles.

## Remaining work

1. Add a forward permission-scope repair migration.
2. Add PostgreSQL upgrade coverage for the old broken `0033` state.
3. Regenerate OpenAPI and generated contracts.
4. Enforce permission-catalog completeness through types/tests.
5. Add organization/scope filter controls to the admin UI.
6. Add PostgreSQL integration CI.
7. Debounce search and narrow frontend filter types.

## Round 6 baseline

Use production baseline:

```text
3c9663b862aceeb27d49ed677d7b20d18209b6e8
```

Exclude the Round 5 documentation-only commits from the production diff.
