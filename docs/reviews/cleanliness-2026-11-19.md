# Cleanliness check — 2026-11-19

Scope: `main` at `4c948ce7` (after PRs #41–#44), plus the folder-README pass in
this branch. Everything below is measured, not judged by eye.

## Verdict

**Structurally clean. Not yet uniform.** Nothing in the repo is the kind of code
that hides bugs — no untyped escapes, no swallowed errors, no dead gates. What is
left is repetition and inconsistency: the same decisions written several times in
slightly different shapes.

| Criterion | Result | Evidence |
| --- | --- | --- |
| Type safety | **pass** | 0 explicit `any` outside tests, 0 `@ts-ignore`/`@ts-nocheck` |
| Suppressions | **pass** | 23 `eslint-disable` lines, each with a stated reason |
| Leftover notes | **pass** | 0 `TODO`/`FIXME`; the two `FIX:` review notes in the request logger were implemented and removed |
| Boundaries | **pass** | 0 wildcard exports, 0 deep cross-package imports, `turbo boundaries` green, 50 packages tagged |
| Dead gates | **pass** | script guard tests, feature-index check, folder-README check and cycle detection all run inside `lint:policy` |
| Error handling | **pass** | `AppError` + catalogs; no `catch {}` in production paths |
| File size | **debt** | 4 files above the 300-line limit (largest: 436) |
| Ports | **debt** | 51 left; 13 have no consumer outside their package |
| Shared code | **debt** | `Math.ceil(total / limit)` hand-written in 27 files |
| Test layout | **debt** | 3 layouts: 138 `__tests__`, 34 co-located, 27 e2e |
| Ceremony | **debt** | 108 use-cases for 101 endpoints; several only forward one repository call |

## What is genuinely clean

- No abstraction invented for a single call site that we could delete safely was
  left in place: two one-implementation ports are gone, the rest are seams.
- The rules that matter are now enforced, not described: boundaries, error-code
  ownership, domain purity, feature manifests, feature indexes, cross-feature
  FKs, folder READMEs, package cycles.
- Tests exist where they matter and none are skipped: 220 spec files, 0 `.skip`.

## What is not clean yet (ordered by value)

1. **13 one-implementation ports** (list in PR #43). Mechanical, covered by tests.
2. **27 page-meta copies** — one shared `buildPageMeta` removes them and the
   class of bug where one endpoint rounds differently.
3. **3 test layouts** — move the 34 co-located specs into `__tests__/`.
4. **Pass-through use-cases** — fold the ones that only call one repository.
5. **4 oversized files** — split by responsibility, not by line count.

## Documentation added in this pass

- `docs/layers/{feature-package,application,domain,infrastructure,presentation}.md`
  — the canonical contract per layer.
- 66 generated `README.md` files inside feature layer folders (one per existing
  `application/`, `domain/`, `infrastructure/`, `presentation/`), so anyone
  landing in a folder reads its rules without opening a 4,000-line document.
- 3 app READMEs (`admin`, `web`, `worker`) where none existed.
- `scripts/generate-folder-readmes.mjs --check` runs inside `lint:policy`, so a
  layer folder created without its README fails the gate.

Note: the five files touched by PR #43 were not Prettier-clean when merged; this
branch formats them. That is exactly the failure mode the format gate exists to
catch — it would have caught it in CI, which is still blocked by billing.
