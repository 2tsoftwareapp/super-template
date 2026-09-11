# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and GitHub issue/PR templates.
- `scripts/rename.mjs` to rebrand the template for a new project.
- Root `CLAUDE.md` documenting the monorepo layout and workflows.
- Strong (primary) reads for authentication and authorization: `getPrimaryDatabaseClient()`,
  `UsersRepositoryPort.findByIdStrong()`, and `AccessControlService.getAccessProfileStrong()` keep
  session, user, and permission decisions off the read replica.

### Changed

- Cleaned up internal review documents and browser-automation artifacts from the repository.
- `DatabaseRlsGuard` now verifies the restricted role on the read-replica pool as well, and startup
  fails when the read-replica capability is enabled without a replica URL
  (`DATABASE_URL_READ_REPLICA`, or `DATABASE_URL_TEST_READ_REPLICA` when `APP_ENV=test`).
- Strong read consistency is rejected when a read replica is configured.
- The env loader no longer rewrites read-replica URLs during primary dynamic-port discovery.
- `pnpm create:project` rejects a feature-selection change on an existing generated target; create a
  new target instead.
