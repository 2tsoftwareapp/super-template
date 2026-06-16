# Backend and Architecture Review - 2026-06-16

## Executive Summary

Status: not ready to treat as green. The backend has a solid NestJS modular base, global validation, exception filtering, request context, Drizzle migrations, session-backed JWT auth, and API contract generation. The main risks are not missing features; they are isolation, boundary discipline, consistency under failure, and red verification gates.

Highest priority issues:

- P0: CI-quality gates are red. `pnpm run lint`, `pnpm --filter web test`, and `pnpm exec turbo boundaries` fail.
- P1: Tenant isolation is only partially implemented. RLS exists for some organization-scoped tables, but request handling does not generally set the PostgreSQL tenant context used by those policies.
- P1: Backend package boundaries are not clean. `api-identity`, `api-platform`, and `api-workspace` import each other's internal modules and services directly, creating cycle risk and weak ownership.
- P1: Several workflows combine DB writes, audit writes, background jobs, and object storage without transactions, idempotency, or compensating cleanup.
- P1: Refresh token rotation is vulnerable to concurrent refresh races because the old token hash is verified and replaced in separate operations without a compare-and-swap update.

## Scope and Method

Reviewed areas:

- Root monorepo and Turbo configuration.
- NestJS API bootstrapping, app module, guards, interceptors, filters, validation, and config.
- Backend packages: `api-core`, `api-database`, `api-identity`, `api-platform`, `api-workspace`, and `api-contract`.
- PostgreSQL schema and migrations, especially tenant columns and RLS.
- Auth, users, projects, files, imports, exports, jobs, notifications, audit, settings, and health paths.
- Web/admin/mobile integration surfaces where they affect backend architecture and generated contracts.

Relevant skill lenses applied:

- NestJS architecture and security best practices.
- PostgreSQL table design and RLS review.
- Turborepo task graph and package boundary review.
- Vite/admin surface sanity check.
- Flutter layered architecture sanity check for generated API and mobile integration.

## Verification Results

Commands run:

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm run typecheck` | Passed | 9 tasks successful, 5 cached. |
| `pnpm --filter admin typecheck` | Passed | Vite admin typecheck is currently green. |
| `pnpm --filter api test` | Passed | Vitest: 3 files, 12 tests. |
| `pnpm run lint` | Failed | API Biome import ordering/formatting issues and one unused import. |
| `pnpm --filter web test` | Failed | Two hoisted mock failures and one shell text assertion failure. |
| `pnpm exec turbo boundaries` | Failed | 323 issues reported across 1112 files in 11 packages. |
| `pnpm exec turbo run build --dry=json` | Passed dry run | Shows build tasks have no upstream dependencies. |

`pnpm run lint` failures observed:

- `apps/api/test/support/test-app.ts:11` has unused `createDatabaseClient`.
- Import ordering issues in `apps/api/src/app.module.ts`, `apps/api/src/database/reset.ts`, `apps/api/src/main.ts`, `apps/api/src/modules/health/application/health.service.ts`, `apps/api/src/shell/auth.guard.ts`, `apps/api/src/shell/tenant-context.interceptor.ts`, and API tests.
- Formatting issue in `apps/api/src/database/seed-data.ts`.

`pnpm --filter web test` failures observed:

- `src/lib/server/backend.test.ts`: Vitest hoisted mock error, `Cannot access 'readAuthCookiesMock' before initialization`.
- `src/app/(public)/login/page.test.tsx`: Vitest hoisted mock error, `Cannot access 'webFetchMock' before initialization`.
- `src/components/app/shell.test.tsx`: expected `Client`, rendered `Client workspace`.

Full root verification was not run after those failures because `scripts/verify.sh` and root `verify` both require lint/tests to pass before build/mobile checks.

## Strengths

- `apps/api/src/main.ts:24` enables a strict global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`, and implicit conversion.
- `apps/api/src/main.ts:19` enables Helmet and `apps/api/src/main.ts:20` configures credentialed CORS from environment config.
- `apps/api/src/app.module.ts:39` registers global exception filtering, auth guard, permission guard, response envelope interceptor, and tenant context interceptor.
- `packages/api-database/src/database.module.ts:16` owns pool shutdown through Nest lifecycle hooks.
- Auth uses session-backed access and refresh tokens with token type checks, refresh token hashing, reuse detection, and explicit session revocation behavior.
- Job claiming uses `FOR UPDATE SKIP LOCKED` in `packages/api-platform/src/modules/jobs/infrastructure/jobs.repository.ts:74`, which is the right primitive for multi-worker dequeueing.
- Generated contracts are wired from Nest OpenAPI into TypeScript and Dart clients.

## Findings

### P0 - Quality Gates Are Red

The repository cannot currently pass its own quality gates. This blocks reliable merge/release confidence.

Evidence:

- Root `package.json:17` defines `verify` as generate, lint, typecheck, test, and build.
- `scripts/verify.sh:25` also runs contract generation, lint, typecheck, tests, build, Dart format, Flutter analyze, and Flutter tests.
- `pnpm run lint` fails in API Biome checks.
- `pnpm --filter web test` fails in three test files.
- `pnpm exec turbo boundaries` reports 323 package-boundary issues.

Recommendation:

- Fix lint and web tests first. These are mechanical blockers and should be cleared before deeper architecture work.
- Add `turbo boundaries` to the official verification path only after rules are configured to distinguish allowed shared-package imports from real domain leaks.

### P1 - Tenant Isolation and RLS Are Incomplete

RLS policies rely on PostgreSQL settings such as `app.tenant_id`, but the normal request path only stores tenant data in an application-level async context.

Evidence:

- `packages/api-database/src/tenant-context.ts:14` defines `setTenantContextOnExecutor`, which calls `set_config('app.tenant_id', ...)`.
- `packages/api-database/src/tenant-context.ts:29` defines `withTenantContext`, but repositories generally default to the raw database executor.
- `apps/api/src/shell/tenant-context.interceptor.ts:39` calls `tenantContextService.run(...)`, but it does not call `setTenantContextOnExecutor`.
- `apps/api/drizzle/0004_organizations_rls.sql:51` to `apps/api/drizzle/0004_organizations_rls.sql:62` enables RLS only for `projects`, `files`, `notifications`, and `audit_logs`.
- The same migration adds `organization_id` to `notification_jobs`, `attachments`, `jobs`, `invitations`, `import_jobs`, `export_jobs`, `comments`, and `activities` at `apps/api/drizzle/0004_organizations_rls.sql:26` to `apps/api/drizzle/0004_organizations_rls.sql:35`, but does not enable RLS policies on those tables.
- The schema adds organization indexes only for `projects`, `notifications`, and `files`; `audit_logs`, `jobs`, `attachments`, `comments`, `import_jobs`, and `export_jobs` rely on other indexes instead of an organization access path.

Risk:

- If a repository misses an `organizationId` filter, partial RLS will not protect all tenant-scoped tables.
- For tables with RLS enabled, production queries can fail or return empty results if the app DB role does not bypass RLS and no DB-local tenant setting is present.
- Tests may miss this if they run with a privileged owner role or rely on service-level filters.

Recommendation:

- Decide whether RLS is a hard security boundary. If yes, route all tenant-sensitive repository calls through a tenant-aware DB executor or transaction wrapper that sets DB-local context before queries.
- Add RLS policies for every tenant-scoped table or deliberately remove partial RLS until the enforcement model is complete.
- Add integration tests using the same non-owner application database role intended for production.
- Add organization indexes on every high-cardinality tenant access path, including audit, jobs, attachments, invitations, comments, activities, imports, and exports where queried by organization.

### P1 - Backend Package Boundaries Are Too Coupled

The package names suggest clean domains, but implementation imports cross-package internals directly.

Evidence:

- `packages/api-identity/src/modules/auth/auth.module.ts:4` imports `AuditModule` from `api-platform`.
- `packages/api-identity/src/modules/auth/auth.module.ts:5` imports `MailModule` from `api-platform`.
- `packages/api-identity/src/modules/users/application/users.service.ts:13` imports `AuditService` from `api-platform`.
- `packages/api-platform/src/modules/jobs/application/jobs.service.ts:5` imports `AuthRepository` from `api-identity`.
- `packages/api-platform/src/modules/jobs/application/jobs.service.ts:7` imports `NotificationsService` from `api-workspace`.
- `packages/api-platform/src/modules/exports/application/exports.service.ts:12` imports `ProjectsRepository` from `api-workspace`.
- `packages/api-workspace/src/modules/projects/application/projects.service.ts:12` imports `AttachmentsRepository` from `api-platform`.
- `packages/api-workspace/src/modules/projects/application/projects.service.ts:13` imports `AuditService` from `api-platform`.
- `pnpm exec turbo boundaries` reports 323 boundary issues.

Risk:

- Package names no longer communicate ownership.
- Nest module cycles become easy to introduce and hard to debug.
- Feature changes require knowledge of unrelated domain internals.
- Package-level caching/build graph value is reduced because packages are not meaningfully independent.

Recommendation:

- Define one direction for backend dependencies. A practical shape is: `api` composition root -> feature packages -> `api-core`/`api-database`; feature packages should not import other feature internals.
- Move shared constants, decorators, permission names, event types, and ports into `api-core`.
- Replace direct service imports across features with ports/events, for example `AuditWriter`, `MailSender`, `NotificationPublisher`, and `UserLookup`.
- Configure `turbo boundaries` tags/rules so allowed imports are explicit and real domain leaks fail in CI.

### P1 - Multi-Step Writes Are Not Consistently Atomic or Idempotent

Several workflows mix database writes, audit writes, file storage, and notification dispatch without transactions or compensating cleanup.

Evidence:

- `packages/api-platform/src/modules/files/application/files.service.ts:58` uploads object storage before `filesRepository.create` at `packages/api-platform/src/modules/files/application/files.service.ts:64`. If the DB insert or audit write fails, the object can be orphaned.
- `packages/api-platform/src/modules/files/application/files.service.ts:110` soft-deletes the DB row before object storage deletion at `packages/api-platform/src/modules/files/application/files.service.ts:111`. If storage deletion fails, state diverges.
- `packages/api-platform/src/modules/exports/application/exports.service.ts:36` creates the export job, `packages/api-platform/src/modules/exports/application/exports.service.ts:49` generates/uploads the file, then `packages/api-platform/src/modules/exports/application/exports.service.ts:51` updates the job. Failure paths can leave orphaned files or stale job state.
- `packages/api-workspace/src/modules/notifications/application/notifications.service.ts:289` creates notification rows in batches, dispatches them at `packages/api-workspace/src/modules/notifications/application/notifications.service.ts:300`, then marks the job completed at `packages/api-workspace/src/modules/notifications/application/notifications.service.ts:307`. Retry after partial failure can duplicate notifications.
- `packages/api-platform/src/modules/jobs/application/jobs.service.ts:44` keeps `files.cleanup` as a stub, so there is no compensating cleanup path for orphaned uploads.

Recommendation:

- Use transactions for logically atomic DB updates.
- For object storage, use a compensating cleanup strategy: delete uploaded object if DB insert/audit fails, or write a pending file record first and finalize after upload.
- For notifications and background work, add idempotency keys or unique constraints per job/recipient.
- Add an outbox pattern for side effects that must survive process crashes.

### P1 - Refresh Token Rotation Is Not Atomic Under Concurrency

The refresh flow verifies the existing token hash and later replaces it without a conditional update against the old hash.

Evidence:

- `packages/api-identity/src/modules/auth/application/auth.service.ts:243` loads and verifies the refresh token.
- `packages/api-identity/src/modules/auth/application/auth.service.ts:275` verifies the provided token against the stored hash.
- `packages/api-identity/src/modules/auth/application/auth.service.ts:308` calls `rotateSessionTokens`.
- `packages/api-identity/src/modules/auth/application/auth.service.ts:735` updates the session hash by `sessionId` only.

Risk:

- Two concurrent refresh requests can both verify the old hash before either writes the new hash.
- Both requests can receive token pairs, while only the last written refresh token remains valid.
- A legitimate client can hit false reuse/revocation behavior because of race timing.

Recommendation:

- Rotate in one transaction with row lock or conditional update.
- Match on `sessionId`, `userId`, old `refreshTokenHash`, and `revokedAt IS NULL`.
- If the conditional update affects zero rows, treat it as reuse or stale refresh and revoke according to policy.

### P2 - Background Notification Jobs Miss Tenant Context

Generic jobs have an `organization_id` column in schema, but enqueueing and the `notification.send` handler do not propagate it.

Evidence:

- `packages/api-platform/src/modules/jobs/application/jobs.service.ts:80` enqueue input has no `organizationId`.
- `packages/api-platform/src/modules/jobs/application/jobs.service.ts:88` creates jobs without `organizationId`.
- `packages/api-platform/src/modules/jobs/application/jobs.service.ts:64` calls `notificationsService.sendToUser(null, ...)`.
- `NotificationsService.sendToUser` resolves organization from actor or input, so a null actor requires an explicit organization id.
- `packages/api-database/src/schema/platform/jobs.ts:11` has `organizationId`, but it is nullable and not populated by generic enqueue.

Risk:

- `notification.send` jobs can fail when processing because no organization can be resolved.
- Admin job listings and cancellation are not tenant-filtered, which is acceptable only if admin roles are truly global rather than organization-scoped.

Recommendation:

- Add `organizationId` to generic job enqueue input and job payload contracts.
- Pass organization id into notification handlers.
- Decide whether jobs are global or tenant-scoped, then enforce that in repository list/get/cancel operations.

### P2 - Rate Limiting Is Not Wired Into Runtime

The API depends on `@nestjs/throttler`, and tests override `ThrottlerGuard`, but the application module does not configure throttling.

Evidence:

- `apps/api/package.json:37` includes `@nestjs/throttler`.
- `apps/api/test/support/test-app.ts` overrides `ThrottlerGuard`.
- `apps/api/src/app.module.ts:29` imports config, logging, schedule, database, health, identity, platform, and workspace modules, but no throttler module or global throttler guard.

Risk:

- Auth, password reset, invite, and write endpoints are more exposed to brute force and abuse.

Recommendation:

- Add `ThrottlerModule.forRootAsync` with environment-driven limits.
- Register a global throttler guard.
- Apply stricter endpoint-level throttles to auth and invitation endpoints.

### P2 - Graceful Shutdown Is Incomplete

The database module implements `OnApplicationShutdown`, but the Nest app does not enable shutdown hooks.

Evidence:

- `packages/api-database/src/database.module.ts:16` implements `OnApplicationShutdown` and closes the pool at `packages/api-database/src/database.module.ts:19`.
- `apps/api/src/main.ts:57` starts listening without a preceding `app.enableShutdownHooks()`.

Risk:

- In container/serverless termination paths, the process may not call lifecycle shutdown hooks consistently, leaving DB connections open until process exit.

Recommendation:

- Call `app.enableShutdownHooks()` during bootstrap before `app.listen`.
- Add a shutdown smoke test or runtime check for SIGTERM behavior in deployment docs.

### P2 - Turbo Pipeline and Contract Generation Need Hardening

The current Turbo config does not model package build dependencies and has root-relative outputs inside package tasks.

Evidence:

- `turbo.json:5` sets `build.dependsOn` to an empty array.
- `turbo.json:6` uses generic outputs `dist/**` and `.next/**` for every package, including packages whose build script is typecheck-only.
- `turbo.json:14` defines `generate` outputs as `apps/api/openapi.json` and `packages/api-contract/src/generated/**`. In Turbo task outputs, these are package-relative unless root-qualified.
- `apps/api/package.json:13` writes the generated TypeScript contract into `../../packages/api-contract/src/generated/index.ts`, meaning the `api` package generate task writes into another package.
- Root `package.json:11` uses `turbo run dev --parallel`; this intentionally bypasses dependency graph ordering.

Risk:

- Builds can run before upstream package code is ready.
- Cache metadata can be misleading because outputs do not match package behavior.
- Cross-package generation makes task ownership unclear and can create stale generated artifacts.

Recommendation:

- Set `build.dependsOn` to `["^build"]`.
- Give each package accurate outputs or no outputs when it only typechecks.
- Use `$TURBO_ROOT$/apps/api/openapi.json` and `$TURBO_ROOT$/packages/api-contract/src/generated/**` when outputs are root-relative.
- Move TypeScript contract generation ownership to `api-contract`, with `api` producing only OpenAPI.
- Avoid `--parallel` for normal root `dev` unless every persistent task truly has no startup dependency.

### P2 - Generated and Runtime Artifacts Are Tracked

Several non-source artifacts are in version control.

Evidence:

- `git ls-files` shows `apps/api/storage/uploads/983fdf5a-dea8-445a-8ece-d620dde0a2d0/bb7af88c-6edf-4a62-b705-9bee70e734f7.png`.
- `git ls-files` shows `packages/api-core/tsconfig.tsbuildinfo`, `packages/api-database/tsconfig.tsbuildinfo`, `packages/api-identity/tsconfig.tsbuildinfo`, `packages/api-platform/tsconfig.tsbuildinfo`, and `packages/api-workspace/tsconfig.tsbuildinfo`.

Risk:

- Runtime uploads can leak data and make test/dev state non-reproducible.
- TypeScript build info files create noisy diffs and stale cache coupling.

Recommendation:

- Remove tracked runtime upload files unless they are deliberate fixtures stored under a fixture path.
- Add storage/upload directories and `tsconfig.tsbuildinfo` to `.gitignore`.
- Keep generated API source only if it is intentionally committed; do not commit generator build folders or local build cache.

### P3 - Controller Parameter Validation Is Inconsistent

Many controllers accept route ids as raw strings without `ParseUUIDPipe` or DTO validation.

Evidence:

- Examples include `packages/api-workspace/src/modules/projects/presentation/projects.controller.ts:70`, `packages/api-platform/src/modules/files/presentation/files.controller.ts:62`, `packages/api-platform/src/modules/jobs/presentation/admin-jobs.controller.ts:42`, and `packages/api-identity/src/modules/users/presentation/admin-users.controller.ts:75`.

Risk:

- Invalid ids reach service/repository code and create inconsistent error responses or wasted DB queries.

Recommendation:

- Apply `ParseUUIDPipe` for UUID route params.
- Add tests for invalid id response shape.

### P3 - File Upload Limits Are Enforced Too Late

The file service checks file size after Multer has already accepted the file buffer.

Evidence:

- `packages/api-platform/src/modules/files/presentation/files.controller.ts:33` uses `FileInterceptor('file')` without explicit limits.
- `packages/api-platform/src/modules/files/application/files.service.ts:48` checks the size after `file.buffer` exists.

Risk:

- Oversized uploads consume memory before being rejected.

Recommendation:

- Configure Multer `limits.fileSize` at the interceptor/module level.
- Consider streaming storage for larger production uploads.

### P3 - Architecture Documentation Is Behind the Code

The documentation describes the intended architecture but not the current dependency reality.

Evidence:

- Docs present clean app-to-package layering, but actual code has cross-feature imports between identity, platform, and workspace.
- The architecture guidance says browser requests do not call the Nest API directly, while the admin Vite app uses API proxy/direct backend integration.

Recommendation:

- Update architecture docs after boundary decisions are made.
- Document which clients are BFF-only and which are allowed to call the Nest API.
- Include a package dependency diagram generated from the actual import graph, not only the intended graph.

## Recommended Fix Order

1. Clear mechanical gates: fix API Biome lint, fix web tests, and rerun `pnpm run lint`, `pnpm run typecheck`, `pnpm --filter api test`, and `pnpm --filter web test`.
2. Add missing operational safety: `app.enableShutdownHooks()` and global throttling.
3. Decide the tenant isolation model. Either complete RLS with DB tenant context and production-role tests, or remove partial RLS until it is ready.
4. Make refresh token rotation atomic.
5. Fix transactional/idempotency gaps in files, exports, project delete/restore, and notification jobs.
6. Define backend package ownership and break feature-package cycles using ports/events.
7. Configure Turbo boundaries and task outputs after the intended package graph is explicit.
8. Remove tracked runtime/build artifacts and update ignore rules.
9. Update architecture docs to reflect the actual accepted structure.

## Open Questions

- Are admin roles global across all organizations, or scoped to one organization? This changes how admin jobs, notification jobs, audit, and settings endpoints should filter data.
- Is PostgreSQL RLS intended to be a hard production security boundary, or only defense-in-depth behind service-level filters?
- Should generated API clients be committed, or generated during CI/release? The current repo commits generated API source, which is workable, but the generation ownership should be clearer.
- Is mobile verification required in the standard local gate for every backend change? `scripts/verify.sh` says yes, root `package.json` says no.

## Final Assessment

The codebase is a credible full-stack starter, but the backend architecture is currently between two states: modular monolith packages exist, while runtime dependencies still behave like a tightly coupled application. That is acceptable early, but it should be made explicit and cleaned before the template is treated as production-grade.

The most important architectural decision is tenant isolation. If this template advertises organization tenancy, RLS and repository filtering must be consistently enforced, tested with production-like DB roles, and backed by clear package boundaries. After that, transaction/idempotency work and Turbo boundary enforcement will make the repo much easier to maintain.
