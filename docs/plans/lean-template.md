# Lean-template plan

Goal: keep the package boundaries (they enforce one-way dependencies), remove the
ceremony that lives *inside* each package, and give agents a contract they can
actually follow.

Non-goals: no rewrite of the auth model, RLS, contract generation or the feature
manifest/composition mechanism. Those carry real value and real tests.

## Baseline (measured 2026-11-19)

| Metric | Now | Why it hurts |
| --- | --- | --- |
| TS LOC | 98,370 | — |
| Packages | 47 (25 `feature-*`) | each feature repeats manifest/module/turbo/tsconfig/exports |
| Endpoints | 101 | — |
| Use-case classes | 108 | ~1 per endpoint, many just forward a repository call |
| `*.port.ts` files | 53 (≈1 impl each) | interface + token + provider + adapter for something that never swaps |
| Adapters | 16 | some exist only to bind a port to its only implementation |
| Test layouts | 3 (138 `__tests__`, 34 co-located, 27 in `apps/api/test`) | no single place to look |
| `Math.ceil(total/limit)` | 27 files | shared logic copied per feature |
| Rule prose | 1,665 + 1,964 + 363 lines, plus 263 `.agents` files | no agent (or human) holds it; not enforceable |
| Agent entrypoint | `AGENTS.md` described the `.agents` kit, not the code | agents never saw the real conventions |

## Slices

Each slice lands separately, green on `pnpm run check`, with the metric it moves.

### S1 — One contract for humans and agents (done)

- `AGENTS.md` rewritten as the engineering contract (non-negotiables, DoD, where
  rules live).
- `docs/CONVENTIONS.md` added: feature shape, when a layer/port/use-case is
  allowed, naming, sizes, tests, errors.
- `CLAUDE.md` reduced to a pointer, so the two entrypoints cannot drift again.
- Exit: an agent reading only `AGENTS.md` + `CONVENTIONS.md` can add an endpoint
  without opening a 4,000-line document.

### S2 — Delete one-implementation ports (pilot: 3 features)

Pilot on `feature-settings`, `feature-users`, `feature-mail`:

- replace `@Inject(TOKEN) port` with the concrete class where the port has one
  implementation and no cross-process boundary;
- delete the port file, its token export and the `useExisting` provider;
- keep ports that are real boundaries (storage, mail transport, worker dispatch,
  cross-feature contracts).

Exit: ≥12 port files deleted in the pilot, `pnpm run check` green, no behaviour
change (same tests). Then repeat per feature.

### S3 — Fold pass-through use-cases

- merge use-cases whose body only forwards one repository call into the feature
  service or the controller's service call;
- keep use-cases that own a transaction or coordinate ≥2 collaborators.

Exit: use-case count 108 → ≤70; each deletion justified by "no transaction, one
collaborator" in the PR body.

### S4 — One shared list/pagination path

- add `buildPageMeta(total, page, limit)` to `@repo/api-runtime/pagination` and
  use it in the 27 sites that hand-roll `totalPages`;
- add a shared `ListQuery` shape so features stop redefining page/limit/sort;
- add a lint rule that forbids `Math.ceil(total` in feature packages.

Exit: 0 occurrences of the hand-rolled formula; one DTO shape.

### S5 — One test layout

- move the 34 co-located `*.spec.ts` into `__tests__/` next to their subject;
- keep `apps/api/test/*.e2e.spec.ts` for HTTP flows only.

Exit: `rg --files -g '*.spec.ts' | grep -v __tests__` returns only the e2e
directory.

### S6 — Variant packages out of the default surface

The capability variants (`tenant-schema`, `tenant-shared-schema`,
`org-model-personal-orgs`, `database-read-replica`) are correct as a design, but
they double the surface an adopter must understand.

- move them to `examples/capabilities/` (kept buildable, out of the default
  workspace test matrix), or document them as "read before enabling" in one page;
- keep the default profile as the only supported starting point.

Exit: `pnpm run check` no longer builds the variants by default; one doc page
explains how to enable each.

### S7 — Generator + docs aligned

- `scaffold:feature` must emit the S1 shape (service/repository/controller/dto),
  not the 8-file use-case skeleton;
- docs that name files/commands are checked by a test (the previous review found
  three commands in `ARCHITECTURE_RULES.md` that did not exist).

Exit: a generated feature passes `pnpm run check` with no manual edits, and the
doc-command check fails if a documented command disappears.

## Order and risk

S1 is free. S2–S3 are mechanical and covered by existing tests. S4 is additive.
S5 is churn-only. S6 is a packaging decision. S7 comes last, once the shape is
stable — generating the old shape faster would make the problem worse.

Track the metrics table above at the end of each slice; the target is roughly
**−20% LOC and −40 files** without losing a single test.
