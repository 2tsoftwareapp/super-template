# Working in this repository

This file is the engineering contract. Read it before touching code.
Everything below is either enforced by lint/tests or checked in review; anything
that is only "advice" belongs in `docs/CONVENTIONS.md`, not here.

## What this is

A pnpm + Turborepo monorepo: one PostgreSQL schema, one OpenAPI contract, four
clients (web, admin, mobile, API).

```
apps/api      NestJS REST API — composition root only, no business logic (:3001)
apps/web      Next.js — public landing (:3000)
apps/admin    Next.js — operations console + auth BFF (:3002)
apps/mobile   Flutter (iOS/Android)
packages/     kernel, runtime, database, contract, web-*, feature-*
```

Backend business logic lives in `packages/feature-*`; a feature is a compile-time
plugin listed in `packages/app-composition/src/feature-registry.ts`. The API host
composes what that registry returns — do not add feature code to `apps/api`.

## Non-negotiables

1. **Types are strict.** No `any`, no `as unknown as` outside a JSON/storage
   boundary, no non-null assertions. No `@ts-ignore`.
2. **No swallowed errors.** `catch {}` and catch-and-ignore are bugs. Either map
   to an `AppError` with a catalog code, or rethrow.
3. **No silent fallbacks** that turn a configuration or programming mistake into
   plausible behaviour. Fail where the mistake is.
4. **Dependencies point one way.** `api-kernel` stays framework-free; a feature
   never imports another feature's internals (only `/contracts`, `/schema`,
   `/module`, `/testing`); features never import `apps/*`.
5. **One exported class per file**, kebab-case filenames, ≤300 lines per file.
6. **Tests travel with the code**: `src/**/__tests__/<name>.spec.ts`. Only
   cross-feature HTTP flows go in `apps/api/test/*.e2e.spec.ts`.
7. **No new abstraction without a second implementation.** Do not add a port,
   interface, adapter or factory for something that has exactly one
   implementation today. See `docs/CONVENTIONS.md` §2.
8. **No per-feature copies of shared logic.** Pagination, sorting, mapping,
   error shapes and cache invalidation come from the shared packages
   (`@repo/api-runtime/pagination`, `@repo/api-sort`, `@repo/api-kernel`).
9. **Schema changes ship as migrations.** Never edit applied SQL; add a new file.
10. **Secrets never enter the repo or the logs.** Mask query strings, tokens and
    personal data; `.env.development` holds non-secret defaults only.

## Definition of done

A change is done when all of these are true:

```bash
pnpm run check          # lint:policy + eslint + typecheck + unit tests
pnpm run format:check
```

…plus, when you touched SQL or HTTP behaviour: `pnpm --filter api test:e2e`
(with Postgres up), and when you touched `apps/mobile`: `pnpm run mobile:check`.

Do not report a task as done on the strength of a build alone, and do not
disable a failing gate to get green.

## Where the rules live

| Document | Status | What it answers |
| --- | --- | --- |
| **this file** | authoritative | how to work here, non-negotiables |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | authoritative | concrete shape of a feature, naming, when to add a layer |
| [`docs/CLEAN_CODE.md`](docs/CLEAN_CODE.md) | authoritative | the measured baseline and the six rules that fix it |
| [`docs/architecture/ARCHITECTURE_RULES.md`](docs/architecture/ARCHITECTURE_RULES.md) | reference | deep rationale, layer-by-layer |
| [`CODING_RULES.md`](CODING_RULES.md) | reference | long-form code review checklist |
| [`docs/architecture/NAMING_CONVENTIONS.md`](docs/architecture/NAMING_CONVENTIONS.md) | reference | naming details |

If two documents disagree, `AGENTS.md` and `docs/CONVENTIONS.md` win; fix the
other one in the same change. Do not add a fourth rule document.

## Commands

```bash
pnpm bootstrap        # install + local env
make dev              # docker + api + web + admin
pnpm generate         # OpenAPI + TS/Dart clients
pnpm run check        # the gate that matters
pnpm verify           # full verification (needs Postgres)
```

## Agent kit (optional, not about this codebase)

`.agents/START_HERE.md` documents the installed session/skill tooling
(quick-fix vs full lifecycle). It is a workflow helper — it is never a substitute
for the non-negotiables above, and it does not describe this project's code.
