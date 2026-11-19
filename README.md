# super-template-lean

A full-stack starter with four surfaces — **api, web, admin, mobile** — plus a
worker, built with clean code and no ceremony.

- Backend: NestJS + Drizzle + Postgres, one folder per feature.
- Web: Next.js landing. Admin: Next.js console. Mobile: Flutter.
- No plugin system, no ports with one implementation, no codegen pipeline.

## Quick start

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm dev            # api on http://localhost:3001
pnpm run check      # typecheck + tests
```

## Branches

| Branch | Purpose                                                                   |
| ------ | ------------------------------------------------------------------------- |
| `main` | this lean template                                                        |
| `max`  | the full enterprise template (plugin architecture, multi-tenant, SSO/MFA) |

Rules: `AGENTS.md` (contract) and `docs/CONVENTIONS.md` (shape). Both are short.
