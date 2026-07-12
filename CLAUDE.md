# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## What this is

A production-ready full-stack monorepo template: one PostgreSQL schema, one OpenAPI
contract, and four clients (web, admin, mobile, API). Turborepo + pnpm workspaces.

## Layout

```
apps/
  api      NestJS REST API + Swagger/OpenAPI (:3001)
  web      Next.js BFF — landing + auth (:3000)
  admin    Next.js BFF — operations console (:3002)
  mobile   Flutter app (iOS/Android)
packages/
  @repo/api-seed        development/demo data seeding
  @repo/api-contract    OpenAPI contract source of truth
  @repo/api-core        shared ports, config, cross-context tokens
  @repo/api-database     Drizzle schema + migrations
  @repo/api-health       health checks
  @repo/api-identity     auth, RBAC, MFA (bounded context)
  @repo/api-platform     platform features (bounded context)
  @repo/api-sort         sorting/query helpers
  @repo/env-loader       layered env resolution
  @repo/web-core         shared web UI + logic (consumed by web & admin)
  @repo/web-test         shared web test utilities
  @repo/eslint-config / @repo/tsconfig   shared config
infra/
  docker-compose.yml     Postgres + Redis + Mailpit for local dev
```

## Common commands

```bash
make bootstrap      # or pnpm bootstrap — install + set up local env
pnpm run env:doctor # validate toolchain + layered env files
make dev            # start API + web + admin (runs docker compose first)
make dev-mobile     # Flutter, separate terminal
pnpm generate       # regenerate the OpenAPI contract + Dart/TS clients
pnpm lint           # source-policy checks + turbo lint
pnpm typecheck
pnpm test
pnpm verify         # db + contract checks
```

Local dev depends on Docker (`infra/docker-compose.yml` provides Postgres, Redis, Mailpit).
Mailpit UI: http://localhost:8025 · Swagger: http://localhost:3001/api/docs

## Working agreements

- **Contract is generated.** After editing NestJS controllers, DTOs, or decorators,
  run `pnpm generate` and commit the regenerated clients. Don't hand-edit generated
  code under `apps/mobile/lib/generated/`.
- **Mirror existing patterns** in the bounded-context packages (`presentation/` →
  `application/` → `infrastructure/`) rather than introducing new structure.
- **Env files**: commit `.env.example`, `.env.development`, and `.env.*.example` only.
  Put personal secrets in `.env.local` (gitignored).
- **App Router layering (web + admin)**: Route files in `src/app/[locale]/**` must only contain route entry components (`page.tsx`, `layout.tsx`, Suspense page wrappers) and metadata/SEO exports. Views, drawers, forms, table columns, and other UI components live under `src/features/<resource>/components/`. No file under the app router directory may contain business logic — ESLint boundary rules enforce that `app/**` never imports `@tanstack/react-query` or `@/lib/http`. UI primitives come only from `@repo/web-core/components/*` (never local copies). Full conventions: `apps/admin/AGENTS.md`; i18n is next-intl with an always-prefixed `[locale]` segment and internal navigation via `@/i18n/navigation`.
- **Modular Admin Architecture Layers**:
  - *Network Layer*: HTTP endpoints wrapped cleanly in services (e.g., `roles-service.ts`) using the unified fetch handler.
  - *Business & Data Layer*: Dedicated react-query queries and mutations (e.g., `use-roles-queries.ts`) managing caching, invalidation logic, and operation states.
  - *State & Serialization Layer*: Parameter parsing/stringifying helpers (e.g., `users-search-params.ts`) managing list states.
  - *Mapping & Validation Layer*: Explicit DTO types and zod schema configurations (e.g., `roles-schemas.ts`).
  - *Atom Component Design*: Keep page views layout-centric, splitting complex interfaces into atomic presentational sub-components (like table cells, specific card atoms, drawer components) and keeping logic out of UI markup.

## Known hazards

- **TypeScript 7 dual toolchain**: type-checking + package emit use TS7 (native) via
  `tools/tsc7` (`typescript7` alias); the `typescript@5.9.3` in every package is a
  library shim for tools that still need the old JS compiler API (typescript-eslint,
  ts-node, Next checker). Don't "upgrade" the 5.9.3 pin independently, and never add
  a bare `typescript` dep resolving to 7.x at the root — auto-install-peers will
  silently break typed linting. Details: packages/tsconfig/README.md.
- **OpenAPI boot step in `generate-contracts.sh` can be flaky.** If it fails to boot,
  regeneration may need a retry; a regen can also surface latent type bugs in web/admin.
- **Generated Dart files need `// @dart=3.0`** or `flutter test` fails on CFE part files.
  This is baked into `generate-contracts.sh`.
- **Tailwind `@source`**: admin/web `globals.css` must include `@source` for
  `packages/web-core/src`, or shared utility classes silently vanish from compiled CSS.
- **Cross-module circular DI** in `api-platform` can cause a silent `process.abort()`
  in e2e; use `abortOnError: false` + `forwardRef` both directions.

## Making this template your own

Run `node scripts/rename.mjs "<Your Project Name>"` to rebrand the template. See the
README "Make it yours" section.
