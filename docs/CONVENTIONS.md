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

- Controllers return `{ data }` (lists: `{ data, meta }`); the global
  `AppExceptionFilter` turns every failure into `{ error: { code, message } }`.
- Validate `@Body()`/`@Query()` with `validate(Dto)` from `src/shared/validation.ts`
  (tsx emits no decorator metadata, so a global pipe cannot see DTO types).
- Throw `AppError(code, message, status)` with a code from `src/shared/errors.ts`.
- Pagination: one helper, `buildPageMeta(total, page, limit)`. Do not hand-write
  `Math.ceil(total / limit)` in a feature.

## Database

- Schema lives in `packages/db/src/schema.ts`; queries in feature repositories.
- Multi-write operations use one transaction; reads never depend on one. Wrap
  them in `DatabaseService.transaction(...)`: every repository call inside joins it,
  also across features.
- Let constraints decide races (unique email, foreign keys) and map the error with
  `isUniqueViolation` / `isForeignKeyViolation`; a pre-read is not a check.
- New column = new migration (`pnpm --filter @lean/db generate`).

## Tests

- Unit: `__tests__/<subject>.spec.ts` next to the subject.
- HTTP: `apps/api/test/*.e2e.spec.ts`, one file per area, booted with
  `createTestApp()` from `apps/api/test/support.ts`.
- Cover the failure path; a happy-path-only test is a demo, not a test.
