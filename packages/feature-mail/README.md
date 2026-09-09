# @repo/feature-mail

## Responsibility

This package owns the `mail` feature and its application, domain, infrastructure, and presentation boundaries. The feature manifest is exported through `src/index.ts` and is composed by the API runtime.

## Public API

The package declares these public entrypoints: `.`, `./contracts`, `./testing`, `./schema`. Consumers must use these entrypoints instead of importing internal files.

## Feature dependencies

The package declares these feature dependencies: `feature-audit`, `feature-jobs`, `feature-user-preferences`.

## Database and runtime

Database tables are declared by the feature manifest when this feature owns persistence. Migrations live under `apps/api/migrations` and must remain additive and operationally reversible. Seeders, if present, are executed by the API test/bootstrap composition.

## Testing

Run the package tests with `pnpm --filter @repo/feature-mail test`. Unit tests are colocated under `src/**/__tests__`; integration and composition-level tests must use the package or API test boundaries documented in the repository.
