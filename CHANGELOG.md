# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Selectable organization model** (compile-time capability, mirrors tenant
  modes): `feature-org-model-optional` (`org-model-optional`) lets users exist
  and operate **without** any organization — registration/SSO no longer force a
  personal organization, sessions carry `organizationId: null`, and the
  generator accepts `--org-model org-optional|personal-orgs`.
  `feature-org-model-personal-orgs` (`org-model-personal-orgs`) preserves the
  historical always-provision behavior; selecting both is a composition error.
- **User-scoped RLS for organization-less data** (migration
  `0038_org_optional_user_scoped_rls.sql`): every tenant-isolation policy gains
  a branch isolating platform-scope rows (sentinel organization id
  `00000000-0000-0000-0000-000000000000`) to their owner via `app.user_id`, so
  org-less users can never read each other's data at the database level.
  `PLATFORM_SCOPE_ORGANIZATION_ID` / `organizationIdForStorage()` added to
  `@repo/api-kernel`.
- Composed `organizationModelOptions` flows from the feature registry through
  `DatabaseModule.forRoot({ organizationModel })` to the
  `ORGANIZATION_MODEL_OPTIONS` provider; `ResolveOrganizationIdForUserUseCase`
  returns `null` instead of `403` for org-less users in the org-optional model.

- `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and GitHub issue/PR templates.
- `scripts/rename.mjs` to rebrand the template for a new project.
- Root `CLAUDE.md` documenting the monorepo layout and workflows.
- Strong (primary) reads for authentication and authorization: `getPrimaryDatabaseClient()`,
  `UsersRepositoryPort.findByIdStrong()`, and `AccessControlService.getAccessProfileStrong()` keep
  session, user, and permission decisions off the read replica.
- `scripts/db-generate.mjs` — a one-command migration flow. It runs `drizzle-kit generate`, appends
  the new SQL file to the ledger (`meta/_legacy-journal-map.json`), and seals checksums via
  `check-schema.mjs --generate`. `make db-generate` and `pnpm db:generate` now call it.
- `scripts/__tests__/migration-tooling.spec.mjs` — fast regression guards for the migration
  tooling (meta hygiene, schema glob scope, journal numbering).
- `pnpm create:project --skip-install` now prints the follow-up (`git init` + `pnpm install`) and
  warns that the copied `pnpm-lock.yaml` no longer matches the rewritten manifests;
  `--refresh-lockfile` re-resolves it without a full install.

### Fixed

- **`make db-generate` was broken for every consumer of the template.** drizzle-kit parses every
  file in `apps/api/migrations/meta/` that does not start with `_` as a Drizzle snapshot, so
  `legacy-journal-map.json` and `migration-integrity.json` made it abort with `data is malformed`.
  Both are now `_`-prefixed, and `check-schema.mjs` fails with an actionable message if another
  non-snapshot file appears there.
- **`drizzle.config.ts` globbed `persistence/**/*.ts`**, which pulled repositories and DTOs into the
  drizzle-kit bundle and failed with `Parameter decorators only work when experimental decorators
  are enabled`. It now globs only the canonical persistence entry points, matching
  `check-schema.mjs`.
- **A generated migration could collide with an existing `NNNN_*.sql` file** because
  `meta/_journal.json` ended at 36 while the ledger reaches 0037. The journal now records 0037, so
  the next generated migration is 0038.
- `pnpm create:project --skip-install` produced a project whose `pnpm-lock.yaml` no longer matched
  its rewritten manifests, so the first `pnpm install --frozen-lockfile` failed with
  `ERR_PNPM_OUTDATED_LOCKFILE`. The generator now says so explicitly instead of failing silently.
- `scripts/rename.mjs` crashed with `fatal: not a git repository` when run in a freshly generated
  project (which has no `.git`). It now falls back to a filesystem walk whenever `git ls-files`
  is unavailable or returns nothing, so the documented `create` → `rename` flow works.
- `pnpm scaffold:feature` generated a package layout and a wildcard `"./*": "./src/*"` export that
  the repository's own policy gates reject. It now emits the real convention
  (`src/<id>.feature.ts`, explicit `exports` map, persistence/public/testing folders).
- `apps/api/test/unit/schema-drift-check.spec.ts` hardcoded a 30s timeout on tests that copy the
  whole `packages/` tree and then invoke `check-schema.mjs` twice (each shelling out to
  drizzle-kit). On a loaded machine they timed out instead of asserting. The bound is now derived
  from the work being done.

### Changed

- Cleaned up internal review documents and browser-automation artifacts from the repository.
- `DatabaseRlsGuard` now verifies the restricted role on the read-replica pool as well, and startup
  fails when the read-replica capability is enabled without a replica URL
  (`DATABASE_URL_READ_REPLICA`, or `DATABASE_URL_TEST_READ_REPLICA` when `APP_ENV=test`).
- Strong read consistency is rejected when a read replica is configured.
- The env loader no longer rewrites read-replica URLs during primary dynamic-port discovery.
- `pnpm create:project` rejects a feature-selection change on an existing generated target; create a
  new target instead.
