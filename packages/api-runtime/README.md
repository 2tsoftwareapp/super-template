# @repo/api-runtime

NestJS HTTP runtime for the API host: env schema, guards, filters, Redis helpers,
RBAC catalogs, and request middleware.

## Import rules

- **Canonical owners:** import ports/errors/types from `@repo/api-kernel` and
  `FeatureManifest` / compose helpers from `@repo/api-plugin-kit`.
- **This package** owns Nest HTTP surface (`EnvironmentService`, guards, filters,
  decorators, Redis, RBAC helpers).
- **Convenience barrel:** `export * from "@repo/api-kernel"` and
  `export * from "@repo/api-plugin-kit"` exist for the Nest host and legacy
  call sites. Prefer the owning package in new feature code so ownership stays
  obvious and database-runtime never needs this package.
