# Conventions

Concrete shape only. Rationale lives in the commit history and in `AGENTS.md`.

## A backend feature

```
apps/api/src/modules/<feature>/
  <feature>.module.ts       Nest wiring
  <feature>.controller.ts   route + DTO in, service out
  <feature>.service.ts      behaviour, one method per operation
  <feature>.repository.ts   Drizzle queries for this feature
  <feature>.dto.ts          class-validator request/response shapes
  __tests__/
```

Add a layer only when it holds something the others must not:

| Layer            | Add it when                              | Skip it when                   |
| ---------------- | ---------------------------------------- | ------------------------------ |
| `domain/`        | pure rules with edge cases worth testing | DTOs, mappers, getters         |
| separate service | a transaction or ≥2 collaborators        | forwarding one repository call |
| port/interface   | 2 implementations or a process boundary  | one implementation             |

## Naming

- Package `@lean/<area>`; file `kebab-case`; class `PascalCase`; DB `snake_case`.
- Name the concept and the unit: `timeoutMs`, `mustChangePassword`, `retryBudget`.
- Ban `data`, `info`, `result`, `helper`, `manager`, `tmp`.

## Response and errors

- Controllers return the data; a global filter wraps it in `{ data, meta }` or
  `{ error: { code, message } }`.
- Throw `AppError(code, message, status)` with a code from `src/shared/errors.ts`.
- Pagination: one helper, `buildPageMeta(total, page, limit)`. Do not hand-write
  `Math.ceil(total / limit)` in a feature.

## Database

- Schema lives in `packages/db/src/schema.ts`; queries in feature repositories.
- Multi-write operations use one transaction; reads never depend on one.
- New column = new migration (`pnpm --filter @lean/db generate`).

## Tests

- Unit: `__tests__/<subject>.spec.ts` next to the subject.
- HTTP: `apps/api/test/*.e2e.spec.ts`, one file per area.
- Cover the failure path; a happy-path-only test is a demo, not a test.
