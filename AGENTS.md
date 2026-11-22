# Working in this repository

The engineering contract. Read it before touching code. If a rule here cannot be
checked by `pnpm run check`, a reviewer or a grep, it does not belong here.

## What this is

A four-surface starter: `apps/api` (NestJS), `apps/web` and `apps/admin`
(Next.js), `apps/mobile` (Flutter), plus a worker. One Postgres database.

Backend features are **folders**, not packages:

```
apps/api/src/modules/<feature>/
  <feature>.controller.ts   route + validation; no business rules
  <feature>.service.ts      the behaviour; one method per operation
  <feature>.repository.ts   every query this feature owns
  <feature>.dto.ts          request/response shapes
  __tests__/                specs next to the code
```

## Non-negotiables

1. No `any`, no `as unknown as` outside JSON/transport boundaries, no `!`
   (except definite assignment on class-validator DTO fields: `email!: string`).
2. No swallowed errors: `catch {}` is a bug. Map to `AppError` or rethrow.
3. Dependencies point one way: `modules/a` never imports `modules/b` internals;
   cross-feature needs go through `b`'s exported service or a shared type.
4. **No interface with one implementation.** No port, adapter or factory until a
   second implementation or a process boundary exists.
5. No use-case class that only forwards one repository call. A service method is
   the default; extract when a transaction or a second collaborator appears.
6. One exported class per file, kebab-case files, ≤300 lines per file,
   ≤60 lines per function, ≤4 parameters, complexity ≤10.
7. Tests live in `__tests__/<subject>.spec.ts`; an HTTP flow test goes in
   `apps/api/test/<area>.e2e.spec.ts`.
8. Schema changes are new migration files. Never edit an applied migration.
9. Secrets never enter the repo or the logs. `.env.example` holds placeholders.

## Definition of done

```bash
pnpm run check        # typecheck + tests
pnpm run format:check
```

Nothing is done because it compiled. A test that re-implements the logic it
checks is not a test.

## Run it

```bash
pnpm install
docker compose up -d        # Postgres + Mailpit
pnpm db:migrate && pnpm db:seed
pnpm dev / dev:admin / dev:web / dev:worker
pnpm run check              # typecheck + unit/e2e tests
pnpm run format:check
```

Schema lives in `packages/db/src/schema.ts`; after changing it run
`pnpm db:generate && pnpm db:migrate`. Jobs are claimed by `apps/worker` with
`SKIP LOCKED`; a new job type is one entry in `apps/worker/src/handlers.ts` plus
its allow-list in the API DTO.

## Where the rules live

| Document              | Answers                                       |
| --------------------- | --------------------------------------------- |
| this file             | how to work here, non-negotiables             |
| `docs/CONVENTIONS.md` | the concrete shape of a module, naming, sizes |

Do not add a third rule document. Update one of these.
