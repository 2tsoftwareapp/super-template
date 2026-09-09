# @repo/feature-user-management

## Responsibility

This package owns the `user-management` feature and its application, domain, infrastructure, and presentation boundaries. The feature manifest is exported through `src/index.ts` and is composed by the API runtime.

## Public API

The package declares these public entrypoints: `.`, `./module`. Consumers must use these entrypoints instead of importing internal files.

## Feature dependencies

The package declares these feature dependencies: `feature-access-control`, `feature-activities`, `feature-audit`, `feature-organization-management`, `feature-organizations`, `feature-outbox`, `feature-upload`, `feature-users`.

## Database and runtime

Database tables are declared by the feature manifest when this feature owns persistence. Migrations live under `apps/api/migrations` and must remain additive and operationally reversible. Seeders, if present, are executed by the API test/bootstrap composition.

## Testing

Run the package tests with `pnpm --filter @repo/feature-user-management test`. Unit tests are colocated under `src/**/__tests__`; integration and composition-level tests must use the package or API test boundaries documented in the repository.
