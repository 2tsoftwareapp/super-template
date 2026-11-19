# Architecture, Repo Hygiene and CI Review — super-template

Date: 2026-11-19
Scope: root config, `.github/workflows/*`, `scripts/*`, `packages/*` manifests/exports, and the invariant docs
(`docs/architecture/ARCHITECTURE_RULES.md`, `docs/adr/*`, `README.md`, `REVIEW.md`).
Mode: **read-only**. `node_modules` absent, `pnpm`/`turbo` not on PATH — nothing was installed and no build/test was run.
All statements below come from file inspection, `rg`, and `node -e` over the source tree.

Severity counts: **P0: 0 · P1: 4 · P2: 6 · P3: 2** (12 findings).

Items 1–4 of `REVIEW.md` are closed and are **not** re-reported.

---

## What actually holds (verified, not assumed)

These checks passed and are the reason the findings below are scoped narrowly:

- **No deep cross-package imports.** `rg 'from "@repo/[a-z0-9-]+/(src|dist|lib)/'` → 0 hits; no feature imports another feature's internals.
- **No wildcard package exports.** Only `@repo/eslint-config` and `@repo/web-packages` style subpath maps; `check-source-policy.sh:73` rejects `"./*"` and the assertion still matches reality.
- **`exports` maps are otherwise disciplined.** 52 subpaths on `@repo/web-ui`, 1–5 on each feature; the API host resolves them through `package.json`, not by directory walk.
- **No phantom third-party imports.** A per-package scan of every `from "…"` specifier against each manifest's `dependencies`/`devDependencies`/`peerDependencies` returned one hit, and it was a false positive inside a string literal (`packages/api-kernel/src/utils/require-organization.ts`).
- **The three declaration-only packages are correct.** `@repo/tsconfig`, `@repo/eslint-config`, `@repo/test-config` have no `build`/`typecheck`/`test`, which matches `ARCHITECTURE_RULES.md` §2.2 and avoids the "stub script pretends work ran" failure.
- **Feature specs are type-checked** where §15.1 requires it: every `packages/feature-*` with specs runs `tsc -p tsconfig.json && tsc -p tsconfig.spec.json`. The apparent gaps in `apps/*` and `packages/web-*` are false positives — their `tsconfig.json` `include` covers `src/**/*.ts`, so specs are in the program.

---

## Findings

### P1-1 — `apps/worker` is invisible to CI: a worker-only PR runs zero jobs

**Fact.** The `changes` job defines four filters and none of them matches `apps/worker/**`:

```
.github/workflows/ci.yml:36-45   backend:  apps/api/**, packages/*/**, scripts/**, package.json,
                                           pnpm-lock.yaml, pnpm-workspace.yaml, turbo.json,
                                           tsconfig.json, .github/workflows/**
.github/workflows/ci.yml:46-48   frontend: apps/admin/**, apps/web/**
.github/workflows/ci.yml:59-62   mobile:   apps/mobile/**, packages/mobile_core/**,
                                           tools/mobile-verification/**
```

Every job is gated on those outputs (`ci.yml:66`, `:138`, `:268`, `:361`, `:457`). A PR whose diff is confined to
`apps/worker/**` therefore satisfies no `if:` and runs **no job at all** — not lint, not typecheck, not test.

The worker is not a stub: it owns a real host with checks that CI never executes —
`apps/worker/package.json:7` `"build": "nest build"`, `:9` `"lint": "eslint ."`, `:11` `"test": "vitest run test src"`,
`:14` `"typecheck": "tsc -p tsconfig.json --noEmit"` — plus two spec files
(`apps/worker/test/worker-host.spec.ts`, `apps/worker/test/worker-processing.e2e.spec.ts`).
The other two workflows (`architecture-wiki.yml`, `format-schema.yml`) only publish docs and run `format:check`/`schema:check`;
neither touches the worker.

**Impact.** The standalone worker host (`docs/adr/0003-standalone-worker-host.md`) can regress silently. `README.md`'s
repository-layout block does not even list `apps/worker` — the same blind spot, in prose.

**Minimal fix.** Add `- 'apps/worker/**'` to the `backend` filter (it already covers `packages/*` and `scripts`), or add a
dedicated `worker` filter plus a job that runs `pnpm exec turbo run lint typecheck test --filter=worker`. Add `apps/worker`
to the README layout block.

**Confidence.** High — filter lists and `if:` gates read directly from `ci.yml`.

---

### P1-2 — The policy gate silently passes when `ripgrep` is absent (`command -v rg` → `true`)

**Fact.** `check-source-policy.sh` routes every text rule through `search_matches`, whose no-`rg` branch is a bare `true`:

```
scripts/check-source-policy.sh:26-39
  search_matches() {
    pattern=$1; shift
    if command -v rg >/dev/null 2>&1; then
      rg -n "$pattern" "$@" ... || true
      return
    fi
    true            # ← no rg: emit nothing, exit 0
  }
```

`check_policy` treats empty output as "clean" (`:44-52`), so all rules invoked at `:55` (`@boundaries-ignore`) and `:57`
(explicit `any`) report a pass. The remaining rules use `rg` inside `if`/`$( … || true )` (`:61`, `:73`, `:86`, `:93`, `:99`),
which also collapse to "no match" instead of an error. The script then prints its success line and exits 0.

`check-package-cycles.sh` has the same shape at a coarser granularity — the whole check body sits inside
`if command -v rg >/dev/null 2>&1; then … fi` (`scripts/check-package-cycles.sh:18-44`), so without `rg` it falls to
`exit "$failed"` with `failed=0` (`:46`).

**Impact.** On a machine without ripgrep — stock macOS ships none — `pnpm lint` / `pnpm run lint:policy` / `pnpm verify`
report green while *none* of the source-policy rules ran. CI images do carry `rg`, so this is a local-gate false green, which is
exactly the class of failure the gate exists to prevent. It is silent: no warning, no skip message.

**Minimal fix.** Fail closed at the top of both scripts:

```sh
command -v rg >/dev/null 2>&1 || { echo "check-source-policy: ripgrep (rg) is required" >&2; exit 1; }
```

(or implement a `grep -rnE` fallback and keep the two paths in sync). Then delete the `true` branch.

**Confidence.** High — the fallback is three lines and is unconditional.

---

### P1-3 — Four packages carry no turbo tags, so the boundary matrix does not apply to them

**Fact.** Layer tags live in per-package `turbo.json` (`{"extends": ["//"], "tags": ["layer:…"]}`), and the allow-matrix is
root `turbo.json:3-171`. Four workspaces have **no** `turbo.json` at all:

```
packages/feature-database-read-replica/turbo.json     MISSING
packages/feature-tenant-schema/turbo.json             MISSING
packages/feature-tenant-shared-schema/turbo.json      MISSING
apps/worker/turbo.json                                MISSING
```

Every other package and app declares one (e.g. `packages/feature-health/turbo.json:3-4` → `tags: ["layer:feature"]`,
`apps/api/turbo.json` → `layer:app`).

**Impact.** Turborepo's tag rules constrain *tagged* packages; a package with no tags is outside the matrix, so nothing stops
`feature-tenant-schema` from importing an app or a sibling's internals — precisely the imports `ARCHITECTURE_RULES.md` §15.1
and §40 forbid. `apps/worker` is the sharpest case: it is a composition root (`apps/worker/package.json` depends on
`@repo/app-composition`, `@repo/feature-jobs`, `@repo/feature-notifications`, …) and would be allowed to reach into feature
internals without any gate firing. Today no such import exists (verified), so this is a gap in enforcement, not an active violation.

**Minimal fix.** Add the missing manifests:
`apps/worker/turbo.json` → `layer:app`; each of the three capability packages → `layer:feature`.

**Confidence.** High on the missing files; the behavioural consequence ("untagged ⇒ unconstrained") is **inferred** from the
`turbo.json` matrix — `turbo boundaries` could not be executed here.

---

### P1-4 — The API e2e job hardcodes 13 of 15 specs; `database-topology.e2e.spec.ts` never runs

**Fact.** `apps/api/test/` contains 15 `*.e2e.spec.ts` files. The CI job enumerates 13 by name:

```
.github/workflows/ci.yml:340-357
  # Exclude health.e2e: … (tracked separately). The other 12 e2e suites cover tenant/auth/MFA/SSO.
  pnpm --filter api exec vitest run --maxWorkers=1
    test/audit.e2e.spec.ts … test/tenant-isolation.e2e.spec.ts
```

Missing: `test/health.e2e.spec.ts` (excluded on purpose and documented) and **`test/database-topology.e2e.spec.ts`** (not
mentioned anywhere). The comment also says "the other 12" while listing 13 entries — the drift is already visible in the text.

**Impact.** `database-topology.e2e.spec.ts` is the only end-to-end exercise of the read-replica capability that
`create:project --read-replica` can switch on and that `README.md` documents (primary/replica split, `getPrimaryDatabaseClient()`).
Dropping a spec from the list does not fail anything, so the hole is invisible on every green run.

**Minimal fix.** Replace the hand-written list with a glob plus explicit, commented exclusions
(`vitest run test/*.e2e.spec.ts --exclude test/health.e2e.spec.ts`), or add the missing file and correct the count to 13.

**Confidence.** High — file list compared against the literal argument list.

---

### P2-5 — Six guard tests under `scripts/__tests__` never execute, and two docs cite them as verification

**Fact.** `lint:policy` runs exactly two of the files there (`package.json:13`: `error-code-policy.spec.mjs`,
`domain-purity-policy.spec.mjs`) plus `check-cross-feature-fks.regression.mjs`. No other script, workflow, Makefile target or
package test reaches `scripts/__tests__` (turbo `test` only fans out inside each package directory). These files have **zero**
executing references anywhere in the repo:

```
scripts/__tests__/create-project.spec.mjs          (referenced only by docs/architecture/feature-dependency-graph.md:6)
scripts/__tests__/migration-tooling.spec.mjs       (referenced only by CHANGELOG.md:67 and docs/database.md:188)
scripts/__tests__/rename.spec.mjs
scripts/__tests__/ghost-dependencies.spec.mjs
scripts/__tests__/feature-manifest-deps.guard.spec.ts
scripts/__tests__/cross-feature-fk-validator.spec.ts
```

**Impact.** Guard *tests* for the generator, the rename tool and the ghost-dependency/feature-manifest validators are dead
weight; they cannot catch a regression in the very scripts that enforce boundaries. Worse, the docs assert the opposite:
`docs/database.md:188` presents `migration-tooling.spec.mjs` alongside `check-schema.mjs` as the guard, and
`feature-dependency-graph.md:6` says manifests are "checked by `scripts/__tests__/create-project.spec.mjs`". A reader trusts a
test that never runs.

**Minimal fix.** Add a root `test:scripts` (`node --test scripts/__tests__/*.spec.mjs`) plus a vitest project for the two
`.spec.ts` files, and chain it into `lint:policy` (or a new `test:policy` step in `quality`). If any file is intentionally
retired, delete it and fix the two doc references.

**Confidence.** High — reference counts computed per filename, excluding the file itself.

---

### P2-6 — `check:feature-indexes` exists but no gate runs it, while the docs present it as the guard

**Fact.** `package.json:42` defines `"check:feature-indexes": "node scripts/generate-feature-indexes.mjs --check"`. Nothing
invokes it: not `ci.yml`, not `format-schema.yml`, not `verify.sh`, not the Makefile (only `scripts/scaffold-feature.mjs:264`
runs it as a post-scaffold hint).

The docs state the opposite: `docs/architecture/NAMING_CONVENTIONS.md:313-315` — "…`scripts/check-source-policy.sh` rejects it,
and `scripts/generate-feature-indexes.mjs --check` verifies every target exists".

**Impact.** Generated feature indexes / declared `./module`, `./contracts`, `./schema` targets can drift from the manifests and
land green. `docs/architecture-blueprint-compliance-plan.md:65-66` and `docs/development.md:279` tell developers to run the
check manually, which is the only path that ever executes it.

**Minimal fix.** Append `&& node scripts/generate-feature-indexes.mjs --check` to the `lint:policy` chain (it is cheap and
read-only), or add it as a step in the `quality` job next to `schema:check`.

**Confidence.** High.

---

### P2-7 — `ARCHITECTURE_RULES.md` §42 documents three scaffold commands that do not exist

**Fact.**

```
docs/architecture/ARCHITECTURE_RULES.md:1501-1503
  pnpm scaffold:api-feature <name>
  pnpm scaffold:admin-feature <name>
  pnpm scaffold:web-feature <name>
```

`package.json` defines only `scaffold:feature` (`:40`). The other three names appear nowhere in `package.json`, the Makefile or
`scripts/`. Running a documented command yields `ERR_PNPM_NO_SCRIPT`.

**Impact.** §42 is the normative answer to "how do I add a feature"; its first instruction fails. A contributor then either
invents a layout by hand (the exact outcome §42 exists to prevent) or assumes the generator is broken.

**Minimal fix.** Rewrite §42 to the real surface — `pnpm scaffold:feature <name>` — and state what it generates; or add the
three aliases if per-surface scaffolding is genuinely intended.

**Confidence.** High.

---

### P2-8 — §15.1 points at a file that is now a re-export shim, not the composition point

**Fact.** The rules name `apps/api/src/composition/feature-registry.ts` as where composition happens, twice:

```
docs/architecture/ARCHITECTURE_RULES.md:689   > `apps/api/src/composition/feature-registry.ts` composes them for
docs/architecture/ARCHITECTURE_RULES.md:698   composition file (`apps/api/src/composition/feature-registry.ts` for backend +
```

That file is five lines and owns nothing:

```
apps/api/src/composition/feature-registry.ts:1-5
  /** Compatibility export for API-local tests and CLI tooling. … */
  export { enabledFeatures } from "@repo/app-composition";
```

The real registry — the `enabledFeatures` array and the feature imports — is
`packages/app-composition/src/feature-registry.ts:29-51`. `create-project.mjs` rewrites *that* path
(`scripts/create-project.mjs:381-384`, `buildFeatureRegistry` at `:313-343`).

**Impact.** A developer following §15.1 to enable/disable a feature edits the shim, sees the edit compile, and changes nothing.
It also contradicts the doc's own §2 claim that composition lives in `apps/api` — the code has already moved composition into a
package, and the rules were not updated.

**Minimal fix.** In §15.1, name `packages/app-composition/src/feature-registry.ts` as the composition file and describe the
`apps/api` copy as an API-local re-export for tests/CLI. One sentence change in each of the two spots.

**Confidence.** High.

---

### P2-9 — `apps/admin` boundary rules are `warn` on a justification that is no longer true

**Fact.** Two `ARCHITECTURE_RULES.md` §25/§40 rules are downgraded with a "pre-existing violations" note:

```
apps/admin/eslint.config.mjs:72   // NOTE: severity is "warn" (not "error") because pre-existing code has
apps/admin/eslint.config.mjs:79           "warn",
apps/admin/eslint.config.mjs:158  // NOTE: severity is "warn" — 8 pre-existing *.mutations.ts files raise
apps/admin/eslint.config.mjs:161          "warn",
```

The stated debt is gone: `rg 'toast|sonner' apps/admin/src/features/*/api` → **0** matches, and
`rg 'from "@/features/[a-z-]+/(api|controllers)' apps/admin/src/features/*/ui` → **0** matches. The only `@tanstack/react-query`
hit under `features/*/ui` is a test that wraps a `QueryClientProvider`
(`apps/admin/src/features/users/ui/__tests__/user-detail-content.test.tsx:1`), which is legitimate.

**Impact.** ESLint exits 0 on warnings, so both rules are decorative in the primary product app: a new UI component that fetches
via react-query, or an `*.api.ts` that raises a toast, passes `pnpm lint` and CI. `apps/web/eslint.config.mjs` already enforces
the equivalents at `"error"`, so the same violation is caught in one app and ignored in the other.

**Minimal fix.** Promote the two rules to `"error"` in `apps/admin/eslint.config.mjs:79` and `:161` and delete the stale NOTE
comments (the files are already clean), or keep `warn` and gate on `--max-warnings 0` for those paths.

**Confidence.** High on the code state; "the note is stale" is verified by the zero-match counts above.

---

### P2-10 — `check-package-cycles.sh` does not check cycles, and duplicates a rule that already ran

**Fact.** The script is in `lint:policy` (`package.json:13`), but its body only greps two things:

```
scripts/check-package-cycles.sh:20-31   deep feature imports outside /contracts,/schema,/module,/testing
scripts/check-package-cycles.sh:36-42   features importing @/ or apps/
```

There is no graph construction or cycle detection anywhere in the file — no `madge`, no `dependency-cruiser`, no adjacency
walk. The second check duplicates `check-source-policy.sh:93` ("Features must not import apps/*"), which runs earlier in the same
`lint:policy` chain, so one of the two is redundant on every run.

**Impact.** `lint:policy` reports a passing "cycles" step that cannot fail for a cycle. `ARCHITECTURE_RULES.md` §15 treats
circular module dependencies as something the repo tracks; today nothing measures them, and the script name actively discourages
anyone from adding a real check.

**Minimal fix.** Either implement the cycle check the name promises (build the intra-workspace import graph from `@repo/*`
specifiers and fail on SCCs — `scripts/lib/feature-catalog.mjs` already parses manifests and imports with the TypeScript API), or
rename the file to what it does (`check-cross-feature-imports.sh`) and drop the duplicated apps-import rule.

**Confidence.** High on "no cycle detection in this file"; whether `turbo boundaries` would independently report a cycle is
**unverified** (turbo not runnable here), so the finding is scoped to the script.

---

### P3-11 — `@repo/web-ui`'s root export is a catch-all barrel with no consumers

**Fact.** `packages/web-ui/package.json:7` maps `"."` to `./src/index.ts`, and that file is one line:

```
packages/web-ui/src/index.ts:1   export * from "./components";
```

`packages/web-ui/src/components/index.ts` is 50 `export *` lines over 50 components. Nothing imports the root specifier —
`rg 'from "@repo/web-ui"' apps packages` → 0 hits; every consumer imports a subpath (`@repo/web-ui/button`,
`@repo/web-ui/resource-data-table`, …). Eleven declared subpaths are likewise never imported:
`./bulk-action-bar ./calendar ./command ./composables ./date-picker ./dialog ./input-group ./pagination ./refresh-button
./scroll-area ./sheet`.

**Impact.** Low correctness risk, real surface confusion: the package advertises a barrel that `ARCHITECTURE_RULES.md` §28 calls
out as an anti-pattern ("Avoid catch-all `export *` barrels"), and 11 exported entrypoints exist for nothing but the public
surface. Any fix here must be checked against `apps/api/test/unit/public-api-exports.spec.ts`, which asserts every declared
subpath resolves.

**Minimal fix.** Delete the `"."` export and `src/index.ts` (zero consumers), and drop the 11 unused subpath entries — keeping
the components themselves, which are used internally by other `web-ui` files.

**Confidence.** High on consumer counts; the components' internal use means deletion of the *files* is not implied.

---

### P3-12 — `generate:check` exits 0 mid-run when Docker or Dart is missing

**Fact.**

```
scripts/generate-contracts.sh:33-35   if [ "${SKIP_FLUTTER_GENERATION:-}" = "1" ]; then … exit 0
scripts/generate-contracts.sh:38-40   if ! docker info …; then printf '… Docker unavailable …' >&2; exit 0
scripts/generate-contracts.sh:42-45   if ! has_command dart; then printf '… Dart unavailable …' >&2; exit 0
```

`generate-check.sh` calls this script and then diffs only the paths it was told about (`GENERATED_PATHS`, `:14-17`), adding
`apps/mobile/lib/generated/api` to the diff set only when both Docker and Dart are usable (`:18-21`).

**Impact.** The committed Dart client is protected in CI (the `generated` job sets up Flutter, so `dart` exists, and Docker is
available on the runner) but not on a developer machine: `pnpm run generate:check` there verifies only `openapi.json` and
`api-contract/src/generated` and reports success, so stale Dart output is never surfaced locally. The `exit 0` also terminates
the script before any later step, should one be added.

**Minimal fix.** Make the skip explicit and non-zero for the checking path: pass a `--require-dart` flag from
`generate-check.sh` that turns the two `exit 0` branches into `exit 2` with the existing message, leaving `pnpm generate`
permissive for contributors without Docker.

**Confidence.** High on behaviour; the CI-side safety depends on the runner image, which is plausible but **unverified** here.

---

## Unverified / worth a follow-up

1. **`turbo boundaries` semantics for untagged packages and cycles.** Both claims in P1-3 and P2-10 are inferred from config;
   `pnpm exec turbo boundaries --dry` on a machine with `node_modules` would settle them in one run.
2. **`apps/api/tsconfig.json` wildcard path mapping.** It declares `"@repo/feature-*/*": ["../../packages/feature-*/src/*"]`
   alongside explicit entries for only some features, which lets TypeScript accept any deep feature subpath even though the
   `exports` map forbids it at runtime. No such import exists today, and `check-package-cycles.sh` would catch one — so the
   impact is latent. Worth checking whether the wildcard can be dropped now that the explicit entries exist.
3. **`format:check` scope.** `package.json:49` globs `packages/** apps/api apps/admin apps/web` — `apps/worker`, `apps/mobile`,
   `scripts/` and root files are outside it. Not counted as a finding (formatting only), but it is the third place where
   `apps/worker` is treated as a non-member of the repo.
4. **`REVIEW.md` freshness.** Its header says "Last checked: 2026-09-15" and all four items are closed; nothing tracks the
   items above. If this report is accepted, the P1s belong in that file rather than in a dated review folder.
