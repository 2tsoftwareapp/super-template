# Deep Packages Gap Analysis

## Executive conclusion

The monorepo has a coherent package-oriented architecture, and its primary boundary checks now pass. The source policy, package-cycle check, feature-manifest dependency guard, and cross-feature foreign-key guard all pass after restoring the missing `organizationsFeature` export from `feature-organizations/src/index.ts`.

The remaining gaps are concentrated in **test depth**, **coverage governance**, **package documentation**, **integration-test placement**, and **architecture tooling completeness**. These gaps do not currently block TypeScript compilation or the upload feature's verified behavior, but they reduce confidence when changing low-tested packages and make regressions easier to introduce.

The highest-priority unresolved issue is not a compile failure. It is the absence of a reliable quality gate that proves every package's public entrypoint, feature manifest, integration boundary, and meaningful runtime path remain covered after structural changes.

## Audit scope and evidence

The audit covered all package manifests under `packages/`, source trees, public exports, feature manifests, package dependency declarations, test files, migration ownership, architecture scripts, and the current working-tree changes. The following checks were run after fixing the organizations barrel regression:

| Check | Result |
|---|---|
| Source policy | Passed |
| Package cycle check | Passed |
| Feature manifest dependency guard | Passed for 20 feature packages |
| Cross-feature foreign-key guard | Passed |
| Feature root manifest export scan | Passed for all discovered feature manifests |
| Full monorepo build | Passed: 38/38 tasks |
| Full monorepo unit tests | Passed: 37/37 workspace test commands |
| Upload unit tests | Passed: 9 files and 43 tests |
| Upload API E2E | Passed: 1 file and 4 tests |

These results establish that the current code is buildable and that the tested upload flows work. They do not establish line coverage, branch coverage, mutation resistance, production-provider compatibility, or complete package-level integration coverage.

## Prioritized gap register

| ID | Priority | Area | Gap | Current evidence | Impact |
|---|---|---|---|---|---|
| G-01 | P1 | Test coverage | Several packages have no or very few tests. | `feature-users`, `config`, and `utils` have no test files; `feature-mail`, `feature-organizations`, and `feature-outbox` have one test file each. | High regression risk in foundational or widely imported code. |
| G-02 | P1 | Integration testing | `feature-upload/test/integration` contains only a README and no executable test. | Upload integration behavior is tested indirectly through `apps/api/test/files-catalog.e2e.spec.ts`. | Package behavior cannot be validated independently from the complete API composition. |
| G-03 | P1 | Coverage governance | No package exposes a coverage script or repository-wide coverage threshold. | Package manifests expose `test`, but not `test:coverage`; the test pipeline reports pass/fail only. | Passing tests may still leave critical branches, adapters, and error paths untested. |
| G-04 | P1 | Test environment | API and web E2E require an externally running PostgreSQL service at the resolved test port. | Without PostgreSQL, all API E2E suites fail or skip during setup; Playwright cannot start the API server. | E2E validation is not self-contained and can appear to hang for a long time. |
| G-05 | P1 | Architecture tooling | The feature-index checker detects missing `src/index.ts` files but does not validate that an existing root barrel exports its feature manifest. | The audit found `feature-organizations` broken after root export normalization; the manifest guard caught it, not the index checker. | A future barrel change can silently break composition unless a second guard runs. |
| G-06 | P2 | Package documentation | Most feature packages have no package README. | Only `feature-health` and the previously documented upload package have package-level README files among the feature packages. | Contributors lack documented public contracts, composition rules, and ownership boundaries. |
| G-07 | P2 | Upload adapter coverage | Real S3 behavior is not exercised by the package test suite. | Unit tests cover tracking and cleanup with mocks; local and S3 drivers are not tested against a provider-compatible service. | Provider-specific behavior such as presigned URLs, content types, and delete failures can regress unnoticed. |
| G-08 | P2 | Upload integration placement | Upload package-level integration and E2E directories are compatibility boundaries rather than executable suites. | `test/unit`, `test/integration`, and `test/e2e` contain README files only; executable tests remain colocated under `src/**/__tests__`. | The requested architecture is discoverable, but test ownership is split between package internals and the API app. |
| G-09 | P2 | Placeholder boundaries | Several upload compatibility directories intentionally export nothing. | `domain/entities`, `domain/value-objects`, `domain/events`, and infrastructure config have empty barrels. | The tree matches the target shape but can create a false impression that those domain capabilities already exist. |
| G-10 | P2 | Generated-file hygiene | The Next build modified `apps/admin/next-env.d.ts`. | The file changed from `.next/dev/types/routes.d.ts` to `.next/types/routes.d.ts`; Next marks it as generated. | Build output can pollute the working tree and obscure reviewable source changes. |
| G-11 | P3 | Public API validation | Export-path checks validate file existence, not importability or symbol shape. | Manifest checks verify declared paths and dependency usage, while no automated test imports every declared export. | A path can exist but export the wrong symbol or fail under package resolution. |
| G-12 | P3 | Script consistency | Some infrastructure packages intentionally have no test script, while all feature packages do; the convention is not documented. | `eslint-config`, `test-config`, `tsconfig`, and `web-test` have no test command, while feature packages do. | Workspace-wide commands require assumptions about whether a package is executable, declarative, or test-only. |

## Detailed findings

### 1. Test distribution is uneven

The repository has strong testing in several security-sensitive features, including authentication, MFA, SSO, import/export, and notifications. The distribution is not uniform, however. `feature-users` has no package-local test file even though it owns a foundational user model and is imported by many other features. `config` and `utils` also have no tests despite being shared infrastructure. `feature-mail`, `feature-organizations`, and `feature-outbox` have only one test file each.

This is a risk concentration problem rather than a simple test-count problem. A package with few tests can still be correct, but foundational packages should have direct tests for their public contracts, failure behavior, persistence mapping, and authorization boundaries instead of relying only on downstream feature tests.

**Recommended action:** add contract-focused tests for `feature-users`, `config`, and `utils` first. Then add repository and authorization tests for `feature-organizations`, delivery/error-path tests for `feature-mail`, and dispatch/idempotency tests for `feature-outbox`.

### 2. Upload is functionally verified but not independently integrated

The upload unit suite has meaningful coverage: policy validation, file-access policy, version creation, batch deletion, attachments, cleanup, and tracking behavior are all exercised. The upload API E2E suite also passed all four scenarios covering catalog operations, tenant isolation, versions, history, batch deletion, and idempotency.

The remaining limitation is test ownership. The package-level integration and E2E directories contain documentation only. The executable integration behavior lives under `apps/api/test`, where it depends on the complete application composition, seed data, RLS roles, and a PostgreSQL service. This is appropriate for composition-level E2E, but it leaves no independently runnable package integration suite for the upload repositories and storage adapters.

**Recommended action:** add a package-level integration configuration that provisions a disposable database schema or test database and tests `FilesRepository`, `AttachmentsRepository`, `StorageTrackingRepository`, and the local object-storage adapter. Keep `apps/api/test/files-catalog.e2e.spec.ts` as the composition-level E2E suite.

### 3. There is no quantitative coverage gate

The test commands prove that selected assertions pass, but they do not report or enforce statement, branch, function, or line coverage. There is also no mutation-testing or changed-file coverage gate. This makes it difficult to determine whether important negative paths are covered, especially in storage cleanup, RLS handling, retries, authorization, and migration-sensitive repositories.

**Recommended action:** add a repository coverage command using the existing Vitest setup, publish a per-package summary, and set initial thresholds only after collecting a baseline. Thresholds should be stricter for domain policies and use cases than for framework wiring. Add a changed-file coverage check in CI after the baseline stabilizes.

### 4. E2E provisioning is fragile and expensive when infrastructure is absent

The API E2E tests depend on PostgreSQL at the resolved test port and on the restricted application role required by the RLS guard. When the service is absent, the suite spends substantial time failing setup or waiting for application initialization. Web Playwright tests inherit the same dependency because their configured API server must initialize the database guard.

The failure mode is now understandable, but it is not fast. A preflight check should fail in seconds with a direct remediation message before Vitest or Playwright starts. The check should verify port availability, database connectivity, migration state, and the restricted role rather than merely testing whether a TCP port is open.

**Recommended action:** create a single `test:preflight` command used by API and web E2E. It should validate the resolved `DATABASE_URL_TEST`, verify RLS role properties, and report the exact Docker command needed to start infrastructure.

### 5. Barrel normalization needs a stronger invariant

The audit found a concrete regression after package roots were redirected to `src/index.ts`: `feature-organizations/src/index.ts` did not export `organizationsFeature`. The package built successfully, but the feature manifest dependency guard failed because composition could no longer discover the manifest through the declared public entrypoint.

The current feature-index checker is useful for detecting missing barrels and generating them, but it does not validate existing barrels against their discovered manifest. The manifest guard provides that validation indirectly. This separation is easy to miss and permits a partial check to pass while the composition contract is broken.

**Recommended action:** extend `scripts/generate-feature-indexes.mjs --check` so it verifies that every package root exports its discovered `*Feature` symbol and that every declared `./module`, `./contracts`, `./schema`, and `./testing` target exists. Add a regression test for the organizations failure mode.

### 6. Documentation does not match the package scale

The repository has useful README files for core and runtime packages, but most feature packages lack package-level documentation. The package manifests and source layout expose important contracts that are not explained in one place: feature IDs, dependency declarations, schema ownership, public subpaths, seeders, test boundaries, and disabling/migration behavior.

**Recommended action:** add a short README to every feature package using a common template. The template should document the feature ID, public exports, composition dependencies, database tables, seeders, test command, and prohibited imports.

### 7. Upload compatibility paths need explicit status documentation

The upload compatibility tree currently contains empty barrels for entities, value objects, events, and configuration. This is a reasonable non-duplicating implementation choice, but the structure can be misunderstood as unfinished domain logic or as a guarantee that those abstractions already exist.

**Recommended action:** keep the compatibility paths, but document them as intentional boundaries. Add a package README stating that the authoritative implementations remain under `files`, `attachments`, and `storage`, and add a guard against introducing duplicate repositories or drivers in the compatibility directories.

### 8. Generated Next metadata should not remain as source drift

The full build changed `apps/admin/next-env.d.ts`, which is a generated Next.js file. The change is not part of the package architecture work. It should either be restored before commit or handled by the repository's generated-file policy.

**Recommended action:** revert the generated `next-env.d.ts` change if it is unrelated to the intended work. If the new Next path is required by the installed Next version, update the repository's generation policy deliberately and document the change separately.

## Recommended implementation sequence

| Phase | Scope | Acceptance criteria |
|---|---|---|
| Phase 1 | Fix quality gates | Feature index checker validates manifest exports; regression test covers `feature-organizations`; generated-file policy is explicit. |
| Phase 2 | Protect foundational packages | Add direct tests for `feature-users`, `config`, `utils`, and the lowest-tested feature packages. |
| Phase 3 | Complete upload integration boundaries | Add executable package integration tests for repositories and local storage; retain API composition E2E. |
| Phase 4 | Establish coverage governance | Add coverage reporting, baseline thresholds, and changed-file coverage checks. |
| Phase 5 | Document all feature packages | Every feature package has a README covering public API, dependencies, schema, seeders, and test boundaries. |
| Phase 6 | Harden E2E preflight | Add fast database/RLS preflight and make API/web E2E fail immediately when infrastructure is unavailable. |

## Remediation status

The first remediation pass is complete for the highest-value tooling and test gaps. The feature index checker now validates existing root barrels, discovered feature-manifest exports, and declared export targets. Direct tests were added for shared configuration, JSON utilities, the foundational users mapper, and the outbox registry. The upload package now has an executable local-storage integration test and mocked S3 provider-boundary tests. All feature packages now have a common package README generated from their manifest metadata.

Coverage reporting is enabled for `feature-upload`, `config`, and `utils`. The upload baseline currently passes the temporary thresholds with **53.53% lines, 53.11% statements, 41.6% branches, and 34.4% functions**. The shared config and utils packages exceed their stricter thresholds. A fast E2E preflight now validates PostgreSQL connectivity and rejects a superuser connection that bypasses row-level security. The local `.env` test URL was corrected to use the restricted application role.

The remaining gaps are narrower. `feature-users` still needs repository and authorization tests beyond the mapper contract. Upload persistence repositories and database RLS paths still require executable database integration tests, and the S3 tests use mocked AWS SDK calls rather than a live provider-compatible service. The generated `apps/admin/next-env.d.ts` change remains a working-tree hygiene issue and should be reverted or explicitly adopted according to the Next.js version policy.

## Final assessment

The monorepo is structurally healthy enough to build and compose. The architecture guards are valuable and currently pass. The first remediation pass made the most important guarantees repeatable: root barrels are validated semantically, foundational shared packages have direct tests, upload has package-level filesystem and provider-boundary coverage, and E2E provisioning fails fast with explicit diagnostics.

The upload feature itself is not the primary functional gap. Its unit and composition-level E2E behavior is currently verified. The main remaining upload gap is **database-backed integration coverage for persistence and RLS**, followed by a live provider-compatible object-storage test.

## References

[1]: ../scripts/check-source-policy.sh "Repository source policy checks"
[2]: ../scripts/check-package-cycles.sh "Cross-feature boundary checks"
[3]: ../scripts/check-feature-manifest-deps.mjs "Feature manifest dependency guard"
[4]: ../scripts/generate-feature-indexes.mjs "Feature index generator and checker"
[5]: ../packages/feature-upload/package.json "Upload package manifest and test scripts"
[6]: ../apps/api/test/files-catalog.e2e.spec.ts "Upload composition-level E2E suite"
[7]: ../apps/api/vitest.config.ts "API Vitest and package alias configuration"
[8]: ../infra/docker-compose.yml "Local PostgreSQL, Redis, and Mailpit services"
[9]: ../scripts/verify.sh "Repository verification workflow"
[10]: ../turbo.json "Turborepo task and layer configuration"
