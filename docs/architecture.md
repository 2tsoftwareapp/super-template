# Architecture

## Repository Architecture

- `apps/api`: modular monolith NestJS backend
- `apps/web`: Next.js SEO landing (static marketing surface, no BFF)
- `apps/admin`: Next.js primary app with same-origin BFF for auth and operations
- `apps/mobile`: Flutter app using generated Dart API client (auth + profile shell)
- `packages/api-contract`: generated TypeScript OpenAPI types
- `packages/api-seed`: development/demo data seeding (idempotent seeds per module)
- `packages/api-health`: health-check module
- `packages/api-database`: Drizzle schema and migrations
- `packages/api-core`: shared backend primitives, RBAC, ports
- `packages/api-identity`: authentication, organizations, RBAC, users, preferences
- `packages/api-platform`: cross-cutting platform modules (mail, files, jobs, audit, notifications, activities)
- `infra`: Docker Compose for PostgreSQL, Redis, and Mailpit
- `scripts`: bootstrap, contract generation, verification, and infra helpers

## Backend Boundaries

API features live in bounded-context packages (`api-identity`, `api-platform`) inside a pragmatic clean modular monolith. Dependency direction matters: HTTP/controllers stay at the edge, services own application behavior, repositories own database access, and cross-context calls go through stable module exports or `api-core` port tokens.

### Identity (`api-identity`)

- `auth`: registration, login, refresh rotation, logout, reset, verification, session management, MFA, SSO
- `users`: self-service profile plus administrative user management
- `organizations`: tenant membership and organization management
- `access-control`: roles, permissions, enforcement helpers

### Platform (`api-platform`)

Cross-cutting capabilities shared across tenants:

- `notifications` + `activities`: inbox, SSE, FCM push, scheduled sends, activity feed
- `audit`: append-only audit logging
- `storage` + `files` + `attachments`: object storage, upload metadata, polymorphic attachments
- `mail`: SMTP delivery, templates, delivery log
- `settings`: application settings
- `jobs`: PostgreSQL-backed background job queue
- `imports` + `exports`: CSV import/export framework

Workspace domain features (projects, comments, invitations) have been removed from the template.

## RBAC and tenancy

Authorization uses three layers:

1. **Permission check** — `resource.action` grants from role matrix (`api-core`)
2. **Role scope** — route guards and `@Authorize()` decorators
3. **RLS** — PostgreSQL row-level security via `TenantContextService`

**Tenant rule:** `organizationId` for RLS always comes from the authenticated session user, never from client-supplied body fields.

## Web vs Admin

| Surface | Role |
|---------|------|
| `apps/web` | Public SEO landing with CTA to admin |
| `apps/admin` | Primary product UI + BFF auth routes (login, MFA, session cookies) |

Browser requests to the Nest API from admin go through Next.js route handlers. Access and refresh tokens stay in `HttpOnly` cookies with server-side refresh on eligible `401` responses.

### Frontend architecture (both Next.js apps)

Established by the 2026-07 re-architecture (roadmap:
`docs/superpowers/specs/2026-07-11-project-rearchitecture-roadmap.md`):

- **Design system**: `@repo/web-core/components/*` is the single source of UI
  primitives; apps never keep local copies. Full convention set in
  `apps/admin/AGENTS.md`.
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

## Port tokens (`api-core`)

| Token | Bound in | Purpose |
|-------|----------|---------|
| `USER_NOTIFICATION_SENDER` | `PlatformPortsModule` / `NotificationsModule` | Send user notifications from jobs/workflows |
| `AUDIT_WRITER` | `AuditModule` | Append audit log entries |
| `MAIL_TEMPLATE_SENDER` | `MailModule` | Send templated email |
| `BACKGROUND_JOB_ENQUEUER` | `JobsModule` | Enqueue background jobs |
| `ORGANIZATION_LOOKUP` | `IdentityModule` | Resolve organization metadata |
| `USER_LOOKUP` | `IdentityModule` | Resolve user metadata |

## Contract generation

After controller/DTO changes, run `pnpm generate` to regenerate OpenAPI and TypeScript/Dart clients. Do not hand-edit generated mobile Dart files.
