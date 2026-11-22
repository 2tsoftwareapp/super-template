# Testing

Everything runs locally; no CI minutes are needed. A change is done when these
pass:

```bash
pnpm run check            # ESLint + typecheck (every package) + all Vitest suites
pnpm run format:check     # Prettier
pnpm --filter @lean/admin build
pnpm --filter @lean/web build
pnpm docs:build           # when docs changed
cd apps/mobile && dart format --output=none --set-exit-if-changed . && flutter analyze && flutter test
```

## What is tested where

| Suite          | Location                      | Needs Postgres | Covers                                                    |
| -------------- | ----------------------------- | -------------- | --------------------------------------------------------- |
| API unit       | `apps/api/src/**/__tests__/`  | no             | service rules with fakes                                  |
| API HTTP (e2e) | `apps/api/test/*.e2e.spec.ts` | no             | real Nest app, guards, validation, envelopes, error codes |
| Worker         | `apps/worker/src/__tests__/`  | no             | handlers, payload validation, permanent failures          |
| DB helpers     | `packages/db/src/__tests__/`  | no             | retry backoff                                             |
| Mobile         | `apps/mobile/test/`           | no             | `ApiClient` with `MockClient`, login and feature screens  |

The e2e suites boot the whole `AppModule` through `createTestApp()` in
`apps/api/test/support.ts`. It replaces `AuthRepository` and `DatabaseService`
with in-memory versions; override a feature's repository the same way:

```ts
app = await createTestApp(
  (builder) => builder.overrideProvider(NotesRepository).useValue(new InMemoryNotesRepository()),
  auth,
);
```

`support.ts` also gives you `makeUser()`, `signToken(userId)`, the seeded
`ADMIN_ID` / `MEMBER_ID`, and `constraintError("23505")` to simulate a unique or
foreign-key violation from Postgres.

The API output includes two expected stack traces, `Error: insert failed` and
`connect ECONNREFUSED`: those tests check that a failed write and an
unreachable database are handled. They are not failures.

## Run one thing

```bash
pnpm --filter @lean/api test                                   # one package
pnpm --filter @lean/api exec vitest run test/auth.e2e.spec.ts  # one file
pnpm --filter @lean/api exec vitest -t "rotates"               # by test name, watch mode
pnpm lint                                                      # ESLint only
pnpm typecheck                                                 # tsc only
cd apps/mobile && flutter test test/screens_test.dart
```

## Against a real stack

The suites above use fakes. To exercise the real database, worker and mail,
run the stack (`pnpm bootstrap && pnpm dev:all`) and walk the main flows:

```bash
API=http://localhost:3001/api/v1
curl -s $API/health                                   # {"status":"ok","database":"ok"}
curl -s -X POST $API/auth/register -H 'content-type: application/json' \
  -d '{"email":"t1@example.com","password":"Sup3rSecret!","displayName":"T1"}'
curl -s -X POST $API/auth/forgot-password -H 'content-type: application/json' \
  -d '{"email":"t1@example.com"}'                     # mail appears in http://localhost:8025
```

The production images can be checked the same way with
`pnpm prod:up` (see [Deployment](./deployment)).

## Writing tests

- Put unit specs in `__tests__/<subject>.spec.ts` next to the code, HTTP specs
  in `apps/api/test/<area>.e2e.spec.ts`.
- Assert the error `code`, not just the status.
- Cover the failure path: invalid input, missing token, someone else's data.
- A test that re-implements the logic it checks is not a test.
