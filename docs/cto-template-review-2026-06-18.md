# CTO Project Template Review - 2026-06-18

## Executive Decision

Status: **improved to an internal-ready template, but still not a fully self-provisioning golden template**.

The architecture is materially better than a basic starter. It has a modular NestJS backend, validated configuration, RBAC, RLS-aware tenancy, contract generation, a Next.js BFF, a Vite admin app, a Flutter client, Docker infra, and CI coverage. After remediation, the root verification path now passes on a Windows company PC without Flutter/Dart and without a copied root `.env`, degrading gracefully when local Postgres e2e prerequisites are unavailable. The remaining gap is that full API e2e still depends on a provisioned Postgres role/database, and mobile is still not a first-class Turbo target.

Recommended position: **usable as an internal accelerator with pragmatic local fallbacks, not yet suitable as a public or organization-wide golden template**. The next engineering milestone should be "one documented bootstrap, one full local verify with Postgres + Flutter, one CI verify, all green".

## Scope

Reviewed surfaces:

| Area | Coverage |
| --- | --- |
| Monorepo | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, package scripts, package tags, boundaries |
| Backend | NestJS bootstrap, app module, auth guard, tenant context, config, database/RLS, migrations, tests |
| Frontend | Next.js web BFF, Vite admin, auth storage, configs, tests |
| Mobile | Flutter structure, Riverpod layers, generated API client, secure storage, mobile scripts |
| Infra | Docker Compose, env example, bootstrap/dev/generate/verify scripts, GitHub Actions |
| Docs | README, architecture/review docs, manual verification plan |

Specialist lenses used:

| Lens | Applied to |
| --- | --- |
| Turborepo | Task graph, outputs, env hashing, workspace boundaries |
| NestJS best practices | Module design, DI, guards, config, security, tests |
| PostgreSQL/Supabase | Schema, indexes, RLS, app-role posture |
| Flutter architecture | Mobile layering, secure storage, repository/state split |
| Vite/UI/UX | Admin build and client-surface risks |

## Verification Results

Commands executed on Windows/PowerShell from `C:\Users\truongdq\Documents\projects\super-template`:

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm run lint:policy` | Pass | `turbo boundaries` checked 489 files in 13 packages, no issues |
| `pnpm run lint` | Pass | 11 lint tasks successful after policy checks |
| `pnpm run typecheck` | Pass | 11 typecheck tasks successful |
| `pnpm run test` | Pass | API unit tests, web tests, and admin no-test target all passed |
| `pnpm run build` | Pass | Web, admin, API, and backend package builds all passed |
| `pnpm exec turbo run build --dry=json` | Pass dry run | Shows 13 PNPM packages only; no mobile package |
| `flutter --version` | Fail | `flutter` command not found |
| `dart --version` | Fail | `dart` command not found |
| `sh ./scripts/verify.sh` | Pass with targeted skips | Skipped mobile verification and API e2e when local prerequisites were unavailable; lint/typecheck/test/build stayed green |
| `docker info` | Pass | Docker server `29.5.3` available |

Important environment fact: root `.env` does not exist in this checkout. The template now falls back to `.env.example` for non-secret local verification paths, which removes the previous fresh-checkout build/test trap.

## Scorecard

| Dimension | Rating | Notes |
| --- | --- | --- |
| Architecture | B+ | Clear modular-monolith intent, good backend package split, ports used for decoupling |
| Security baseline | B | Strong web BFF cookie path and backend guards; admin token storage is the key gap |
| Tenant isolation | B | RLS coverage and restricted role guard exist, but test setup currently fails locally |
| Developer experience | B- | Bootstrap is documented, root verify is now green on a partially provisioned workstation, but full-stack prereq detection is still uneven |
| CI/CD | B- | CI is broad, but local target parity is weak and mobile is separate from Turbo |
| Monorepo/task model | C+ | Boundaries exist, but target outputs/env/mobile integration need cleanup |
| Test confidence | C | Web has useful tests; API has important e2e tests but local harness is brittle; admin has no tests |
| Mobile readiness | C+ | Good app layering and secure storage, but toolchain/codegen/monorepo integration are weak |
| Template marketability | B- | Local verification is materially more resilient, but full e2e/mobile parity still depends on extra setup |

## P0 Findings

| ID | Finding | Evidence | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| P0-1 | Full API e2e still depends on a provisioned Postgres role/database | `api:test:e2e` still fails here with `password authentication failed for user "postgres"` / `"fullstack_starter_app"` | The strongest backend isolation checks are still environment-gated | Keep unit tests in the default workspace path, but add a documented/local bootstrap step that provisions the DB role and make `test:e2e` the explicit full-stack gate |
| P0-4 | Admin stores auth tokens in `localStorage` | `apps/admin/src/lib/auth.ts` persists access and refresh tokens under `admin-auth` | XSS on the admin app becomes full token theft, including refresh-token persistence | Move admin auth behind the same BFF/HttpOnly-cookie model as web or use a short-lived access token with refresh held in HttpOnly cookie |
| P0-5 | Mobile is still outside the main monorepo verification graph | Flutter/Dart are absent here and Turbo still only covers PNPM packages | Template consumers can get a green root verify without exercising mobile quality gates | Add an explicit mobile package wrapper or root orchestration metadata so local and CI target coverage are honest |

## P1 Findings

| ID | Finding | Evidence | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| P1-1 | Mobile is not a first-class workspace target | `pnpm-workspace.yaml` excludes `apps/mobile`; Turbo dry run lists 13 PNPM packages only | Root `lint`, `typecheck`, `test`, and `build` do not represent the full template | Add mobile wrapper tasks through a workspace package or an explicit root orchestration script with preflight and consistent reporting |
| P1-2 | Turbo task outputs are too broad and sometimes false | Root `build.outputs` is `["dist/**", ".next/**"]` for every package; many backend package `build` scripts run `tsc --noEmit`; build warned no outputs for `@repo/api-core#build` | Cache metadata is misleading and build results are not restored accurately | Move package-specific outputs into package `turbo.json`; use `[]` for no-output checks; use `.next/**` excluding `.next/cache/**` for Next |
| P1-3 | `lint`, `test`, and `typecheck` lack dependency-aware cache invalidation | Root `turbo.json` sets these tasks to `dependsOn: []` | Changing an internal dependency may not invalidate downstream task cache correctly | Use a transit-node task for parallelism with dependency-aware hashing |
| P1-4 | Root dev script bypasses Turbo dependency graph | Root `package.json` uses `turbo run dev --parallel` | Dev startup order and cache semantics are intentionally bypassed | Prefer package `dev` tasks with `with`, `persistent`, and `interruptible` configuration; avoid `--parallel` in committed scripts |
| P1-5 | Environment handling is inconsistent across root, CI, web, and API | API loads root `.env` from multiple paths; web loads app/root `.env`; CI exports env directly; root build has no `.env` | Users see different behavior across local scripts, CI, and app-specific commands | Define one env contract: preflight, copy, validate, and document per target; make root commands fail early with actionable messages |
| P1-6 | Verify preflight is pragmatic but still shell-script based | `scripts/verify.sh` now probes Flutter/Dart/Postgres and skips cleanly when unavailable | Logic is better, but capability detection remains spread across shell and package scripts | Consolidate environment probing into a reusable script so bootstrap/verify/dev share one source of truth |
| P1-7 | Admin test target gives false confidence | `admin:test` uses `vitest run --passWithNoTests` and found no tests | Admin UI can regress with green root tests | Add smoke tests for login, shell navigation, protected routes, and table/form flows; remove `--passWithNoTests` once baseline tests exist |
| P1-8 | Generated Dart client is committed but excluded from normal static policy | Mobile generated code is in `apps/mobile/lib/generated/api`; analyzer excludes it | Contract drift can hide until runtime or mobile-specific CI | Keep generated code committed if desired, but add a drift check that regenerates into temp output and diffs |
| P1-9 | Makefile and scripts assume Unix tooling on a Windows-hosted repo | Makefile uses `/bin/bash`, `source`, `set -a`, shell scripts use `lsof`, `id -u`, `id -g` | Windows developers need Git Bash/WSL or hit unclear command failures | Document required shell explicitly or provide PowerShell equivalents for bootstrap/dev/verify |

## P2 Findings

| ID | Finding | Evidence | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| P2-1 | Admin production bundle needs code splitting | `admin:build` emitted a 570.86 kB JS chunk warning | Admin load performance degrades as feature count grows | Route-level dynamic imports and `manualChunks` for table/query/form/vendor code |
| P2-2 | Root `lint:policy` is not strictly read-only in partial installs | Sequential pass still ran PNPM dependency status/install-like work for `turbo boundaries` | Policy checks can mutate `node_modules` and collide on Windows if run concurrently | Document this, or use `pnpm install --frozen-lockfile` as an explicit pre-step before policy checks |
| P2-3 | Root `generate` ownership is mixed | API package generates TS contract into `packages/api-contract`; script generates Dart client in mobile | Cross-package writes make caching and failure recovery harder | Make `api` own OpenAPI output, `api-contract` own TS generation, and mobile own Dart generation |
| P2-4 | Web e2e depends on a successful production build | Playwright CI webServer runs `pnpm build && pnpm start`; current local build fails without env | E2E is blocked by env setup before route behavior can be tested | Add e2e preflight and local `.env.test` defaults, or make Playwright config export required env |
| P2-5 | Existing review docs conflict with current runtime result | `docs/full-stack-review-2026-06-17.md` says gates are effectively resolved; current `pnpm test`/`build` fail | Developers can trust stale docs and miss current blockers | Mark older reviews superseded by this runtime-backed review or add a review index with status |

## Strengths To Preserve

| Area | Strength |
| --- | --- |
| Backend structure | Feature packages are consistently layered into presentation/application/infrastructure/domain |
| Security | Helmet, strict validation, auth guard, permissions guard, exception filter, per-route auth throttles |
| Tenancy | Restricted DB role migration, startup RLS guard, forced RLS policies on tenant tables, tenant context abstraction |
| Web | BFF pattern avoids browser-held tokens; cookies are HttpOnly for access/refresh; CSRF token support exists |
| Mobile | Secure token storage and single-flight refresh are good mobile defaults |
| Contracts | OpenAPI-driven TS and Dart clients are the right direction for multi-client consistency |
| CI | GitHub Actions includes backend, web, Playwright, and mobile jobs |
| Boundary policy | `turbo boundaries` and custom shell checks provide real architecture enforcement |

## CTO Recommendations

| Priority | Recommendation | Outcome |
| --- | --- | --- |
| 1 | Finish Postgres bootstrap for `api:test:e2e` on local machines | Restores full backend confidence, not just workstation-safe confidence |
| 2 | Add `scripts/preflight` and make every major target call it or fail early | Converts remaining setup drift into actionable diagnostics |
| 3 | Integrate mobile into the official root verification graph | Makes "all targets" true locally, not just in CI/mobile-specific flows |
| 4 | Replace admin localStorage auth with HttpOnly-cookie auth | Removes the largest client-side security gap |
| 5 | Refactor Turbo tasks and outputs | Correct cache behavior and honest build semantics |
| 6 | Integrate mobile into the official local target story | "All target" becomes true locally, not just in CI |
| 7 | Make codegen atomic and package-owned | Prevents partial generated states |
| 8 | Add admin smoke tests and web/admin bundle budgets | Raises client confidence |
| 9 | Update review docs and README troubleshooting | Prevents stale architectural claims |

## Current Go/No-Go

| Use case | Decision |
| --- | --- |
| Internal team starter with senior maintainers | Go |
| Public template for broad developer use | Conditional no-go until full Postgres/mobile parity and preflight consolidation land |
| Production application foundation | Conditional go after admin token storage and local e2e bootstrap are fixed |
| Enterprise golden path | No-go until local/CI target parity and mobile integration are solved |
