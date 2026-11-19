# application/

Orchestration: the place that decides *when* things happen.

**Put here**
- `*.use-case.ts` — one operation, only when it owns a transaction, coordinates
  ≥2 collaborators, or carries a rule that deserves its own test.
- `*.service.ts` — behaviour shared by several use-cases.
- `ports/` — only with two implementations, a process boundary, or a
  cross-feature seam. A repository with one implementation is injected as a class.

**Do not put here**
- SQL/Drizzle, HTTP decorators, DTOs from `presentation/`.
- Another feature's internals (use `@repo/feature-x/contracts`).
- A three-line class that forwards one repository call.

Rules: `docs/layers/application.md` · global contract: `AGENTS.md`.
