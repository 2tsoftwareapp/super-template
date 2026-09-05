# Architecture

## Repository Architecture

- `apps/api`: NestJS composition root — business logic lives in `packages/feature-*`
- `apps/web`: Next.js SEO landing + auth BFF
- `apps/admin`: Next.js primary app with same-origin BFF for auth and operations
- `apps/mobile`: Flutter app using generated Dart API client (auth + profile shell)
- `packages/api-kernel` / `api-plugin-kit` / `api-runtime`: backend kernel split
- `packages/database-runtime`: Drizzle pool, RLS, transactions (composed schema)
- `packages/feature-*`: compile-time feature plugins (auth, users, orgs, mail, …)
- `packages/feature-health`: health-check exemplar plugin
- `packages/api-contract`: generated TypeScript OpenAPI types
- seeding: `apps/api/src/cli/seeds` (run via `pnpm --filter api db:seed`)
- `infra`: Docker Compose for PostgreSQL, Redis, and Mailpit
- `scripts`: bootstrap, contract generation, verification, and infra helpers

## Backend Boundaries

API capabilities are **compile-time feature plugins** under `packages/feature-*`
(see ARCHITECTURE_RULES §15.1 and ADR 0002). `apps/api` only registers manifests
in `src/composition/feature-registry.ts`. Dependency direction matters:
HTTP/controllers stay at the edge, services own application behavior,
repositories own database access, and cross-feature calls go through stable
module exports or `@repo/api-kernel` port tokens.

### Identity features (`packages/feature-*`)

- `feature-auth` / `feature-mfa` / `feature-sso`: registration, login, refresh rotation, logout, reset, verification, sessions
- `feature-users` / `feature-user-management` / `feature-user-preferences`: profile + admin user management
- `feature-organizations` / `feature-organization-management`: tenant membership and org management
- `feature-access-control`: roles, permissions, enforcement helpers

### Platform features (`packages/feature-*`)

Cross-cutting capabilities shared across tenants:

- `feature-notifications` + `feature-activities`: inbox, SSE, FCM push, scheduled sends, activity feed
- `feature-audit` / `feature-audit-export`: append-only audit logging
- `feature-upload`: object storage, upload metadata, attachments
- `feature-mail`: SMTP delivery, templates, delivery log
- `feature-settings`: application settings
- `feature-jobs` / `feature-outbox`: PostgreSQL-backed background job queue + outbox
- `feature-import-export`: CSV import/export framework

Workspace domain features (projects, comments, invitations) have been removed from the template.

## RBAC and tenancy

Authorization uses three layers:

1. **Permission check** — `resource.action` grants from role matrix (`api-kernel` / access-control)
2. **Role scope** — route guards and `@Authorize()` decorators
3. **RLS** — PostgreSQL row-level security via `TenantContextService`

**Tenant rule:** `organizationId` for RLS always comes from the authenticated session user, never from client-supplied body fields.

## Web vs Admin

| Surface      | Role                                                               |
| ------------ | ------------------------------------------------------------------ |
| `apps/web`   | Public SEO landing with CTA to admin                               |
| `apps/admin` | Primary product UI + BFF auth routes (login, MFA, session cookies) |

Browser requests to the Nest API from admin go through Next.js route handlers. Access and refresh tokens stay in `HttpOnly` cookies with server-side refresh on eligible `401` responses.

### Frontend architecture (both Next.js apps)

Established by the 2026-07 re-architecture (roadmap:
`docs/superpowers/specs/2026-07-11-project-rearchitecture-roadmap.md`):

- **Design system**: `@repo/web-ui/components/*` is the single source of UI
  primitives; apps never keep local copies. Full convention set in
  `apps/admin/AGENTS.md`.
- **Unified Admin Layout**: Complete architectural specification for admin layout hierarchy, component APIs (`CommonResourcePage`, `ResourceDataTable`, `ResourceFilterBar`, `ResourceDetailPane`, `ResourcePropertyGrid`, `ResourceStatCards`, `ResourceDrawer`, `ConfirmDialog`), and feature domain matrices in [`docs/architecture/ADMIN_UNIFIED_LAYOUT.md`](architecture/ADMIN_UNIFIED_LAYOUT.md).
- **Layering**: `app/[locale]/**` holds route entries only; business logic
  (services, react-query hooks, zod schemas, feature views) lives under
  `src/features/<resource>/`. ESLint boundary rules enforce that `app/**`
  never imports `@tanstack/react-query` or `@/lib/http`, and `features/**`
  never imports from `app/**`.
- **i18n**: next-intl with an always-prefixed `[locale]` segment (`/en/...`,
  `/vi/...`). Internal navigation goes through `@/i18n/navigation` so the
  locale survives every redirect.
- **Auth gate (admin)**: `src/proxy.ts` (Next 16 proxy) composes a
  cookie-presence pre-filter with next-intl locale negotiation. The
  authoritative session + RBAC state machine is the pure
  `resolveAdminGuard()` consumed by `useAdminGuard()`/`<AdminGuard>`;
  `AdminShell` is purely presentational and reads the validated session —
  including the active `organizationId` — via `useAdminSession()`.

### Backend domain layer

Modules that own real business rules keep them in a framework-free
`modules/<x>/domain/` directory (jobs lifecycle, files upload policy,
identity policies). Criteria: `docs/adr/0001-domain-layer-criteria.md`;
purity is enforced by `scripts/check-source-policy.sh`.

## Redis

`REDIS_URL` is optional in development/test (in-memory fallbacks). In production it is required for distributed rate limiting and shared access-profile cache.

## Flutter Architecture

- `core/`: configuration, network, storage, auth helpers, shared widgets
- `features/`: auth, notifications, profile, organizations
- `generated/api/`: OpenAPI Dart Dio client

The Flutter app stores tokens in secure storage and uses a single-flight refresh path in the Dio interceptor.

## Port tokens (`api-kernel`)

| Token                      | Bound in                                      | Purpose                                     |
| -------------------------- | --------------------------------------------- | ------------------------------------------- |
| `USER_NOTIFICATION_SENDER` | `PlatformPortsModule` / `NotificationsModule` | Send user notifications from jobs/workflows |
| `AUDIT_WRITER`             | `AuditModule`                                 | Append audit log entries                    |
| `MAIL_TEMPLATE_SENDER`     | `MailModule`                                  | Send templated email                        |
| `BACKGROUND_JOB_ENQUEUER`  | `JobsModule`                                  | Enqueue background jobs                     |
| `ORGANIZATION_LOOKUP`      | `IdentityModule`                              | Resolve organization metadata               |
| `USER_LOOKUP`              | `IdentityModule`                              | Resolve user metadata                       |

## Contract generation

After controller/DTO changes, run `pnpm generate` to regenerate OpenAPI and TypeScript/Dart clients. Do not hand-edit generated mobile Dart files.
