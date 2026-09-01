# Project Reference

## Executive summary

- Full-stack monorepo starter: NestJS API (modular monolith), Next.js admin BFF, Next.js web landing, Flutter mobile — multi-tenant with RLS.
- Core business lives in compile-time feature-plugin packages `packages/feature-*` (`@repo/feature-auth`, `@repo/feature-users`, `@repo/feature-access-control`, `@repo/feature-mail`, `@repo/feature-health`); `apps/api` is a thin composition root (`app.module.ts` + `composition/feature-registry.ts`) and `packages/*` holds the kernel libraries.
- Auth = JWT access+refresh rotation in HttpOnly cookies via same-origin Next.js BFF; CSRF + RBAC guards server-side.
- Primary workflow: `make bootstrap` → migrate → seed → generate contracts → `make dev`.
- Biggest risk: dual toolchain TS7/tsc for build scripts — do not bump TypeScript casually (see CLAUDE.md hazards).

## Project identity

- Purpose: production-grade starter template for multi-tenant SaaS products.
- Users/stakeholders: template consumers (dev teams), maintained by truongnat.
- Domain: identity/RBAC, organizations (tenants), platform ops (jobs, mail, files, audit).
- Lifecycle/status: active template; CI on `main` required green before merge.

## Workspaces / apps (monorepo)

| Path | Type | Stack | Entry point | Key commands | Source |
|---|---|---|---|---|---|
| apps/api | app | NestJS 11 + Drizzle + Postgres 18 | `src/main.ts` | `pnpm --filter api dev/build/test` | apps/api/package.json |
| apps/admin | app | Next.js 16 + RHF + TanStack Query/Table | `src/app/[locale]/(app)` | `pnpm --filter admin dev` | apps/admin/package.json |
| apps/web | app | Next.js 16 (landing + auth BFF) | `src/app/[locale]` | `pnpm --filter web dev` | apps/web/package.json |
| apps/mobile | app | Flutter 3 + Riverpod + go_router | `lib/main.dart` | `make dev-mobile` | apps/mobile/pubspec.yaml |
| packages/api-core | package (kernel) | NestJS-free kernel, ports, errors | `src/index.ts` | turbo tasks | packages/api-core/package.json |
| packages/api-database | package (kernel) | Drizzle schema/migrations | `src/schema.ts` | — | packages/api-database/package.json |
| packages/feature-health | package (feature-plugin exemplar) | NestJS terminus indicators + FeatureManifest | `src/health.feature.ts` | — | packages/feature-health/package.json |
| packages/feature-auth, feature-users, feature-access-control, ... | feature plugins | Identity context packages (auth/users/orgs/access-control/mfa/sso) | per-package `src/*.feature.ts` | turbo tasks | packages/feature-*/package.json |
| packages/feature-mail, feature-jobs, feature-upload, ... | feature plugins | Platform context packages (jobs/mail/files/audit/settings…) | per-package `src/*.feature.ts` | turbo tasks | packages/feature-*/package.json |
| packages/api-contract | package | openapi-typescript generated | `src/generated` | `pnpm run generate:contracts` | packages/api-contract/package.json |
| packages/web-ui / web-hooks / web-server / web-utils / web-test | packages (frontend kernel) | React 19 / Next server-only | per-package `src/index.ts` | turbo tasks | packages/*/package.json |

## Technology stack

| Technology | Role | Version | Workspace(s) | Source | Confidence |
|---|---|---|---|---|---|
| Node.js | runtime | 24 (CI) | root | .github/workflows/ci.yml | high |
| pnpm | package manager | 11 | root | packageManager field / lockfile | high |
| TypeScript | language | 5.9.3 (+TS7 toolchain for scripts) | all | package.json files | high |
| NestJS | API framework | 11.1.x | apps/api | apps/api/package.json | high |
| Next.js | admin/web framework | 16 | apps/admin, apps/web | apps/*/package.json | high |
| Drizzle ORM | SQL | 0.45 | api-database, api | packages/api-database | high |
| PostgreSQL | store | 18 (compose), RLS multi-tenant | infra/docker-compose.yml | infra | high |
| Redis | cache/throttle (optional) | compose | apps/api | docker-compose | medium |
| Flutter/Dart | mobile | 3.x | apps/mobile | pubspec.yaml | high |
| Vitest | test runner | 4.1.9 | all TS workspaces | configs | high |

## Architecture and key flows

| Component / flow | Responsibility | Entry point / boundary | Dependencies | Source |
|---|---|---|---|---|
| Identity context | auth/users/orgs/access-control/mfa/sso/preferences | `packages/feature-*/src/...` (e.g. `feature-auth`, `feature-users`, `feature-access-control`) presentation→application→domain→infrastructure | api-core tokens | ARCHITECTURE_RULES §5–15 |
| Platform context | jobs/mail/files/audit/notifications/settings/storage/import-export/activities/attachments | `packages/feature-*/src/...` (e.g. `feature-mail`, `feature-jobs`, `feature-upload`) same layering | api-core tokens | same |
| Feature composition | compile-time plugin wiring (manifest → schema + modules) | `apps/api/src/composition/feature-registry.ts` + `@repo/api-plugin-kit` FeatureManifest | api-core, feature-* | docs/adr/0002 |
| Admin BFF proxy | cookie session, CSRF, refresh single-flight | `apps/admin/src/app/api/**`, `packages/web-server` | web-utils, env-loader | web-server README |
| Contracts | OpenAPI → TS client (+Dart) | `apps/api/openapi.json` → packages/api-contract | nest swagger | scripts/generate-* |
| Cross-context rule | only stable surface (ports/domain/constants) | eslint ctxForbidden + check-package-cycles.sh | — | eslint.config.mjs |

## Business rules

| ID | Rule | Affected area | Source | Confidence |
|---|---|---|---|---|
| BR-001 | DATABASE_URL must use restricted role (RLS); privileged ops use DATABASE_MIGRATE_URL | apps/api boot guard | migration 0007 + main boot check | high |
| BR-002 | Mandatory mail templates cannot be sent manually | mail use-case | send-admin-mail.use-case | high |
| BR-003 | Refresh-token reuse outside grace window revokes session | auth sessions | session-token.service | high |

## Key constraints

| Constraint | Type | Reason/source | Impact |
|---|---|---|---|
| Dual TS toolchain (tsc 5.9 + typescript7 for scripts) | technical | tools/tsc7 pin | don't unify casually; see CLAUDE.md hazards |
| Postgres host port pinned via POSTGRES_EXPOSED_PORT (local/CI = 65432) | technical | env-loader dynamic-port scan honors real-env pin | keep CI workflow + .env aligned |
| CI must stay green on `main` | process | branch protection expectations | fix-forward commits acceptable |

## Verified commands

| Purpose | Command | Source | Confidence |
|---|---|---|---|
| Setup | `make bootstrap` | Makefile | high |
| Run all | `make dev` | Makefile | high |
| Test (repo) | `pnpm -r test` | CI ci.yml | high |
| Lint + policy | `pnpm run lint` (includes lint:policy) | package.json | high |
| Build (repo) | `pnpm build` | turbo | high |
| Contracts check | `pnpm run generate:check` | scripts/generate-check.sh | high |
| Seed | `pnpm --filter api db:seed` | apps/api/package.json | high |

## Project conventions

### Code

- Structure/naming: frontend feature slices `features/<x>/{api,model,controllers,screens,ui,index.ts}`; backend feature plugins `packages/feature-<name>/src/{presentation,application,domain,infrastructure}` (see apps/*/AGENTS.md, ARCHITECTURE_RULES, docs/adr/0002).
- Error handling: AppError + ERROR_CODES from api-core; envelope responses via interceptor.
- Doc-comment style (detected): TSDoc-style `/** */` on exported symbols where non-obvious.
- Flow/rationale comments: numbered `Step N:` markers for multi-stage logic; rationale comments own-marked where non-obvious.

### Git

- Branch mode (`direct` / `checkout`): direct on `main` for template maintenance (PRs welcome externally).
- Base branch: main
- Branch naming: feat/chore/fix(scope)-desc
- Commit convention: Conventional Commits.

### Pull requests

- Title: conventional commit style.
- Required description sections: Summary, Changes, Verification, Risks.
- Required checks: ci workflow green.

### Reports

- Executive-summary style: ≤5 bullets, outcome-focused.
- Developer overview panel (inside each real artifact — not a separate OVERVIEW.md): yes.
- Charts/diagrams (Mermaid): only when decision-changing.
- Progress source of truth: `TASKS.md` + `session.sh status` (no OVERVIEW.md)
- Custom sections: Findings tables use ID/Severity/Location/Evidence/Impact/Recommendation.

### Decision and visual gates

- Critical/blocking question policy: Confirm-first (STOP, ask with method).
- Preferred diagram format: Mermaid.
- HTML decision-aid policy: only for spatial/UI ambiguity.

## Security notes

- Never commit secrets; layered `.env*` committed defaults are dev-only.
- RLS enforced at DB; app connects as restricted role.
- CSRF double-submit cookie for mutations through BFFs; origin allowlist enforced.
- Argon2 password hashing; TOTP MFA; SSO state signed/TTL-limited.

## Authoritative references

| Source | Purpose | Authority |
|---|---|---|
| docs/architecture/ARCHITECTURE_RULES.md | canonical architecture rules | primary |
| docs/architecture.md | overview map | supporting |
| CLAUDE.md | quick map + hazards | supporting |
| apps/*/AGENTS.md | per-app conventions | primary (per app) |

## Agent CLIs

<!-- Filled by: python .agents/tools/session/detect_agents.py --write
Status: available | auth_unknown | missing. Never paste tokens. -->

| CLI id | Status | Path | Auth probe | Notes |
|---|---|---|---|---|
| _(run detect_agents)_ |  |  |  |  |

## Unknowns and conflicts

| Question / conflict | Impact | Owner | Blocking |
|---|---|---|---|
| Mobile module not yet covered by architecture compliance program | low | maintainer | no |

## Freshness

- Mode: manual (init skill not yet run; this file authored from Task-16/17 evidence)
- Generated or updated: 2026-08-23
- Source commit: post Task-17 (df4308e lineage)
- Scope inspected: repo-wide audit sweeps (identity/platform/tooling/docs)
