# Clean code, applied to this repo

Not a summary of the books — the rules that fix what this codebase actually does.
Measured on `main` at `4c948ce7` with a TypeScript AST scan
(`packages/feature-*/src` + `apps/api/src` + runtime/kernel, tests excluded):

| Signal | Count | Standard |
| --- | --- | --- |
| Functions | 1,657 | — |
| Functions > 60 lines | **62** | ≤ 40 (60 tolerated when linear) |
| Functions with cognitive complexity > 10 | **26** | ≤ 10 |
| Functions with > 4 parameters | **58** | 0–2 good, 3 max, 4+ = options object |
| Files > 300 lines | 4 | 300 |

Worst offenders: `update-custom-role.use-case.ts` (115-line execute, cx 24),
`export-audit-logs.use-case.ts` (107), `refresh-session.use-case.ts` (75),
`upload-policy.ts` (cx 28), `notification-delivery.use-case.ts` (cx 21),
`csv.ts` (cx 22).

That is the shape of the problem: the repo is **safe** (no `any`, no swallowed
errors) but **dense and repetitive** — exactly what makes an agent, or a new
teammate, produce plausible-looking code that does not fit.

## 1. The six rules that would have prevented today's mess

Each rule names the failure it prevents, with a real example from this repo.

### R1 — No abstraction without a second caller *(YAGNI, SOLID)*

**Failure:** 53 port files, almost all with one implementation. Each added an
interface, a symbol token, a `useExisting` provider and an adapter.

**Rule:** a port/interface exists only for (a) two real implementations today,
(b) a process boundary, or (c) a seam between features. Otherwise inject the
class. Already applied to `feature-settings` and `feature-mail` (PR #43); 13
internal ports still violate it.

### R2 — A function does one thing, at one level of abstraction *(Martin §3)*

**Failure:** `update-custom-role.execute` is 115 lines and mixes validation,
transaction handling, persistence and audit. `send-mail-template.execute` is cx 20.

**Rule:** orchestrator calls named steps; a step that needs a branch gets its own
function **only if it is reused or independently testable** — do not shred a
coherent algorithm into one-line helpers (the opposite failure).

**Before**
```ts
async execute(command) {
  const role = await this.repo.findById(...);            // 115 lines
  if (!role) throw ...;
  for (const permission of command.permissions) { ... }   // validation
  await this.tx.run(async (tx) => { ... });               // writes
  await this.audit.log({ ... });                          // side effect
}
```
**After**
```ts
async execute(command) {
  const role = await this.requireRole(command.roleId);
  const permissions = await this.resolvePermissions(command.permissions);
  await this.persist(role, permissions);
  await this.auditChanged(role, permissions);
}
```

### R3 — Parameters: 0–2, never 4 silently

**Failure:** 58 functions take 4+ positional parameters.

**Rule:** at 4, introduce a named object (`UpdateRoleInput`); at 3, ask whether
one of them is the object the function should receive instead. This is not
cosmetic: positional booleans are the most common production bug in this repo's
style (`render(doc, isForPrint)`).

### R4 — The same business knowledge lives in one place *(DRY, on purpose)*

**Failure:** `Math.ceil(total / limit)` is written in 27 files; 13 mappers each
re-shape rows by hand; 3 test layouts.

**Rule:** DRY applies to **knowledge**, not to code that merely looks alike. If
two features must change together when the rule changes, it is duplication.
Pagination is; two DTOs with the same field names are not.

### R5 — Names carry intent, units and domain language

**Failure:** `data`, `result`, `info`, `handle`, `manager` are widespread;
`x`/`y` in non-geometric code; booleans phrased negatively.

**Rule:** name the concept, not the mechanism — `daysSinceLastLogin`,
`mustChangePassword`, `timeoutMs`, `retryBudget`. Ban empty nouns. One vocabulary
per concept (`organisation` vs `organization` — pick the DB spelling).

### R6 — Refactor with a safety lock, then stop

**Failure:** none fatal — but the temptation in this repo is a 4,000-line
"cleanup" commit.

**Rule:** behaviour-preserving step + tests between steps; a behaviour change is a
separate PR. Every rule in this document is enforceable by a test or a scanner;
if it isn't, it is an opinion and does not block a merge.

## 2. What "clean" does *not* mean here

- **Not** more layers. This repo already pays for ports, use-cases, mappers and
  DTOs; the next refactor should delete, not add.
- **Not** fewer lines at the cost of clarity. A 50-line linear mapping is fine;
  a 25-line function with four nested ternaries is not.
- **Not** 100% coverage. Tests must cover the boundary and the failure path; a
  test that re-implements the logic is worse than none (see the mobile redirect
  test that passed while `router.dart` did whatever it wanted).

## 3. Enforcement: make the machine hold the rule

| Rule | Check | Status |
| --- | --- | --- |
| No `any`, no `@ts-ignore` | `check-source-policy.sh` | enforced |
| Domain purity, error codes, boundaries, package cycles | `lint:policy` | enforced |
| Folder contracts exist | `generate-folder-readmes.mjs --check` | enforced |
| Formatting | `format:check` | enforced |
| Function length, complexity, params | proposed: ESLint `max-lines-per-function: 60`, `complexity: 10`, `max-params: 4` | **not yet** |
| Duplication of pagination | proposed: `no-restricted-syntax` on `Math.ceil(* /limit)` | **not yet** |

Adoption must be a **ratchet**, not a big bang: add the three ESLint rules as
`warn`, record the current counts in a baseline file, and fail CI only when the
count grows. Fixing the 62 longest functions is a separate, reviewed sequence —
they are 4% of the code and 0% of the recent regressions.

## 4. Order of work (same as `docs/plans/lean-template.md`)

1. Delete the 13 one-implementation ports (mechanical, tests cover it).
2. One `buildPageMeta` in `@repo/api-runtime/pagination`, 27 call sites.
3. Split the 4 oversized files *by responsibility*, writing the characterization
   test first (the audit-export and role-update paths have the thinnest coverage).
4. Fold pass-through use-cases; keep the ones that own a transaction.
5. Only then turn on the ESLint ratchet, with the baseline captured in the same PR.

## 5. References that shaped this

- Robert C. Martin, *Clean Code* / *Clean Architecture* — function size, one level
  of abstraction, dependency rule.
- Martin Fowler, *Refactoring* (2nd) — smell → refactoring catalogue, behaviour-
  preserving steps.
- John Ousterhout, *A Philosophy of Software Design* — deep modules over shallow
  interfaces; complexity is anything that makes the next reader think.
- This repo's own `clean-code` skill (`§2` rules, `§7` exception process) and
  `docs/CONVENTIONS.md` for the concrete layer shape.
