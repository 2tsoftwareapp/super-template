# Target Verification Review - 2026-06-18

## Summary

This file reviews the executable targets exposed by `package.json`, `Makefile`, Turbo, scripts, and CI. Long-running targets (`dev`, servers), destructive targets (`db-reset`, codegen that deletes output), and targets blocked by missing tools are marked explicitly.

Environment observed:

| Capability | Result |
| --- | --- |
| Node/PNPM workspace | Available |
| Docker | Available, server `29.5.3` |
| Root `.env` | Missing |
| Flutter | Missing |
| Dart | Missing |
| Shell | PowerShell host with Unix shell scripts available through `sh`/bash assumptions |

## Root Package Scripts

| Script | Status | Evidence | Notes |
| --- | --- | --- | --- |
| `lint:policy` | Pass | Ran successfully; `turbo boundaries` checked 489 files | Not fully read-only in partial installs because `pnpm exec turbo boundaries` can trigger PNPM dependency status/install work |
| `lint` | Pass | 11 lint tasks successful | Does not include Flutter |
| `typecheck` | Pass | 11 typecheck tasks successful | Does not include Flutter |
| `test` | Pass | API unit tests passed; web tests passed; admin found no tests and exited 0 | API e2e is now intentionally separated from the default workspace test path |
| `build` | Pass | Web, admin, API, and backend package builds passed | Admin still emits a large chunk warning |
| `verify` | Pass with targeted skips | Verified via `sh ./scripts/verify.sh` | Skips mobile verification when Flutter/Dart are missing and skips API e2e when Postgres credentials/connectivity are unavailable |
| `generate` | Pass with safe mobile fallback | `dart` missing; script preserved committed mobile client and skipped Dart generation | TS contract still regenerates; mobile output is no longer deleted first |
| `mobile:doctor` | Fail fast as designed | `pnpm run mobile:doctor` prints a clear Flutter/Dart installation message | Gives Windows/PowerShell users a first-class mobile preflight command |
| `mobile:setup` | Pass | `pnpm run mobile:setup` resolved Flutter from the Scoop fallback and ran `flutter pub get` | Lets the company PC bootstrap mobile dependencies without PATH setup |
| `mobile:test` | Fail fast as designed | `pnpm run mobile:test` exits immediately with the same installation guidance | Avoids deeper Make/bash failure modes on unprovisioned machines |
| `mobile:format-check` | Pass | `pnpm run mobile:format-check` ran `dart format --set-exit-if-changed .` without modifying files | Matches `verify` behavior and keeps checks non-mutating |
| `format` | Not run | Mutating target | `mobile:format-check` now covers the non-mutating verification path for Flutter/Dart |
| `dev` | Not run | Long-running target; uses `turbo run dev --parallel` | Committed `--parallel` bypasses Turbo graph and should be replaced |

## Turbo Tasks

| Task | Current config | Review |
| --- | --- | --- |
| `build` | `dependsOn: ["^build"]`, outputs `dist/**`, `.next/**` | Dependency ordering is good, but outputs are too broad and wrong for no-emit packages; Next should exclude `.next/cache/**` |
| `dev` | `cache: false`, `persistent: true`, env `WEB_PORT`, `ADMIN_PORT` | Root `dev --parallel` weakens this; package-specific `with` config would be clearer |
| `generate` | `dependsOn: ["^generate"]`, root outputs for OpenAPI and TS generated contract | Ownership is mixed; `api` writes into `api-contract`; Dart generation is outside Turbo |
| `lint` | `dependsOn: []` | Fast but cache invalidation is not dependency-aware; use transit node |
| `test` | `dependsOn: []` | Same cache concern; API tests need setup split |
| `typecheck` | `dependsOn: []` | Same cache concern |
| `format` | `cache: false` | Mutating target; add non-mutating check target |

## Makefile Targets

| Target | Status | Review |
| --- | --- | --- |
| `help` | Inspect-only OK | Lists expected commands |
| `bootstrap` | Partial pass by inspection | No longer hard-requires `flutter` to continue root bootstrap | Still assumes Unix shell and DB tooling for the full path |
| `dev` | Not run | Long-running; starts Docker and API/Web/Admin through shell script |
| `dev-api` | Not run | Requires `.env`; uses Unix `source` from Makefile |
| `dev-web` | Not run | Requires `.env`; helpful warning present |
| `dev-admin` | Not run | Requires `.env`; helpful warning present |
| `dev-mobile` | Blocked | Requires Flutter; `apps/mobile/env/dev.json` exists | `pnpm run mobile:dev` is the better Windows/PowerShell entrypoint once Flutter is installed |
| `infra-up` | Not run | Docker available; target likely valid by inspection |
| `infra-down` | Not run | Docker available; target likely valid by inspection |
| `db-generate` | Not run | Requires DB/env and mutates migrations |
| `db-migrate` | Not run | Requires DB/env; CI uses it |
| `db-seed` | Not run | Requires migrated DB/env |
| `db-reset` | Not run | Destructive target; should remain explicit |
| `db-studio` | Not run | Interactive target |
| `generate` | Pass with fallback | Safe here because Dart missing now causes a skip instead of deleting generated mobile output |
| `lint` | Pass via root | `pnpm lint` passed |
| `format` | Not run | Mutating target; no check-only equivalent at root |
| `test` | Pass via root | `pnpm test` passed after API unit/e2e split |
| `test-api` | Pass via root | Default API test target now covers workstation-safe unit tests |
| `test-web` | Pass | Web tests passed during root `pnpm test` |
| `test-mobile` | Blocked | Flutter missing |
| `build` | Pass via root | `pnpm build` passed after web env fallback fix |
| `verify` | Pass with targeted skips | Current machine validated lint, typecheck, tests, and builds successfully; Flutter format verification is now read-only |

## CI Workflow Targets

| Job | Review |
| --- | --- |
| `verify` | Broad and appropriate in intent: Postgres service, migrations, seed, lint, typecheck, API tests, web tests, build, Playwright |
| `mobile` | Good separation for Flutter format/analyze/test |
| Gap | `pnpm run verify` and `make verify` are now aligned through `scripts/verify.sh`, but CI still has stricter full-stack prerequisites than a partially provisioned workstation |
| Gap | CI exports env explicitly, while local root commands require `.env`; this explains why local build/test can fail while CI may pass |

## API Test Failure Details

| Failure class | Evidence | Likely cause |
| --- | --- | --- |
| Test DB auth failure | `password authentication failed for user "postgres"` / `"fullstack_starter_app"` in `api:test:e2e` on this machine | Local Postgres credentials and/or required roles are not provisioned here |
| Env validation failure | Previously thrown from `env.schema.ts` while importing tests | Fixed by removing `AppConfigModule` from the main `@repo/api-core` barrel and importing it through an explicit runtime subpath |
| Cleanup error | Previously possible after init failure | No longer reproduced in the default root test path after splitting unit and e2e targets |

Recommended target split:

| New target | Purpose |
| --- | --- |
| `test` | Pure API package/domain tests with no DB or full app config |
| `test:e2e` | DB-backed API tests with explicit local prerequisites |
| `test:all` | Full API validation when a machine has both unit and e2e prerequisites |
| `test:web` | Existing web Vitest tests |
| `test:admin` | New admin smoke/unit tests, no `--passWithNoTests` |
| `test:mobile` | Flutter tests with toolchain preflight |

## Build Failure Details

| Failure | Evidence | Fix |
| --- | --- | --- |
| Web build requires env | Previously failed collecting `/api/auth/logout`; `API_INTERNAL_URL`, `NEXT_PUBLIC_WEB_URL`, `WEB_ORIGIN` undefined | Fixed by loading `.env.example` fallbacks for local/template builds |
| Admin bundle warning | Vite emitted `assets/index-*.js` at 570.86 kB | Add route-level code splitting and bundle budget |
| Turbo output warning | `no output files found for task @repo/api-core#build` | Do not declare `dist/**` output for `tsc --noEmit` package builds |

## Generate Target Risk

Current `scripts/generate-contracts.sh` flow:

| Step | Risk |
| --- | --- |
| Generate TS contract from existing `apps/api/openapi.json` | Still does not regenerate OpenAPI first despite README saying OpenAPI is regenerated |
| Check `SKIP_FLUTTER_GENERATION` / `CI` | CI intentionally skips Dart generation |
| Check Docker | If Docker unavailable, keeps existing Dart client |
| Generate into temp dir and swap on success | Prevents destructive partial output |
| Run OpenAPI generator in Docker | Docker is available here |
| Run `dart pub get` and `dart run build_runner build` | Dart is missing here, so the script now skips this path and keeps the committed client intact |

Required changes:

| Change | Reason |
| --- | --- |
| Keep preflight `dart` before generation | Avoid partial generated state |
| Keep temp-directory swap | Allows atomic replacement only on success |
| Regenerate `apps/api/openapi.json` before contract clients | Align implementation with README |
| Add `generate:check` | Lets CI verify generated output without writing into source tree |

## Final Target Assessment

| Category | Result |
| --- | --- |
| Green today | `lint:policy`, `lint`, `typecheck`, `test`, `build`, `verify` on a partially provisioned workstation |
| Red today | Explicit `api:test:e2e` on this machine because Postgres credentials/roles are unavailable |
| Blocked by missing local tools | Full Flutter/Dart mobile targets |
| Not executed by design | Long-running dev servers, destructive DB reset, mutating format/generate |
| Highest leverage fix | Make `make bootstrap && make verify` pass on a clean machine with clear preflight errors |
