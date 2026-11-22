# super-template-lean

A full-stack starter with four surfaces — **api, web, admin, mobile** — plus a
worker, built with clean code and no ceremony.

**Docs:** https://2tsoftwareapp.github.io/super-template/ (source in `docs/`).

- Backend: NestJS + Drizzle + Postgres, one folder per feature.
- Web: Next.js landing. Admin: Next.js console. Mobile: Flutter.
- Queue and jobs live in Postgres (`SKIP LOCKED`); no Redis requirement.
- No plugin system, no ports with one implementation, no codegen pipeline.

## Quick start

```bash
pnpm install
docker compose up -d          # Postgres 18 + Mailpit (or point DATABASE_URL at any Postgres)
cp .env.example .env          # read by db scripts, api and worker; exported vars win
pnpm db:migrate && pnpm db:seed

pnpm dev                      # api      -> http://localhost:3001
pnpm dev:admin                # admin    -> http://localhost:3002
pnpm dev:web                  # web      -> http://localhost:3000
pnpm dev:worker               # worker   (claim jobs)
pnpm run check                # typecheck + all tests
```

Mobile (needs Flutter 3.5+):

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001   # Android emulator
flutter run --dart-define=API_BASE_URL=http://localhost:3001  # iOS simulator
```

Debug builds allow plain HTTP to the local API; release builds expect HTTPS.

## Branches — two tracks

| Branch | Purpose                                                                            |
| ------ | ---------------------------------------------------------------------------------- |
| `main` | **this** lean template (simple, four surfaces)                                     |
| `max`  | the full enterprise template (plugin architecture, multi-tenant, SSO/MFA, codegen) |

See `docs/plans/lean-template-v2.md` in the `max` branch for the rationale.

## What the code looks like

```
apps/api/src/modules/<feature>/
  <feature>.controller.ts   route + DTO in, service out
  <feature>.service.ts      behaviour
  <feature>.repository.ts   Drizzle queries
  <feature>.dto.ts          request/response shapes
  __tests__/
```

Rules: `AGENTS.md` (contract) and `docs/CONVENTIONS.md` (shape). Both are short
on purpose; `pnpm run check` is the referee.
