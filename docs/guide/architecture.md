# Architecture

```
apps/
  api/      NestJS HTTP API (port 3001, prefix /api/v1)
  admin/    Next.js admin console + BFF route handlers (port 3002)
  web/      Next.js public landing (port 3000)
  worker/   job runner: claims rows from the jobs table
  mobile/   Flutter client
packages/
  db/       Drizzle schema, migrations, seed, queue helpers
  config/   Zod environment schemas (api, worker, mail)
docs/       this site + CONVENTIONS.md
```

```
browser ──▶ admin BFF (cookies) ──Bearer──▶ API ──Drizzle──▶ Postgres
mobile  ─────────────────────────Bearer──▶ API            ▲
                                                          │ SKIP LOCKED
                                        SMTP ◀── worker ──┘
```

## Backend features are folders

```
apps/api/src/modules/<feature>/
  <feature>.module.ts       Nest wiring
  <feature>.controller.ts   route + validation; no business rules
  <feature>.service.ts      the behaviour; one method per operation
  <feature>.repository.ts   every query this feature owns
  <feature>.dto.ts          request/response shapes
  __tests__/                specs next to the code
```

Current features: `auth`, `users`, `files`, `jobs`, `notifications`, `mail`.
Shared infrastructure lives in `apps/api/src/shared/`: the database service,
the exception filter, error codes, the validation pipe factory and the roles guard.

Dependencies point one way. A feature never imports another feature's
repository; it goes through the other feature's exported service (for example,
`MailService` enqueues through `JobsService`).

## Data

Schema: `packages/db/src/schema.ts`. Tables: `users`, `sessions`, `jobs`,
`files`, `notifications`. A schema change is a new migration:

```bash
pnpm db:generate && pnpm db:migrate
```

Never edit an applied migration.

## Transactions

`DatabaseService.transaction(work)` keeps the open transaction in
`AsyncLocalStorage`. Every repository call made through `database.db` inside
`work` joins it, even across features. Use it whenever an operation writes more
than once (for example, creating a user and the welcome notification).

## Two tracks

| Branch | Purpose                                                                            |
| ------ | ---------------------------------------------------------------------------------- |
| `main` | this lean template                                                                 |
| `max`  | the full enterprise template (plugin architecture, multi-tenant, SSO/MFA, codegen) |
