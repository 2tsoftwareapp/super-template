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
(see ARCHITECTURE_RULES §15.1 and ADR 0002). The enabled set is one explicit list
in `packages/app-composition/src/feature-registry.ts`
(`apps/api/src/composition/feature-registry.ts` is only a compatibility
re-export for API-local tests and CLI tooling). Dependency direction matters:
HTTP/controllers stay at the edge, services own application behavior,
repositories own database access, and cross-feature calls go through stable
module exports or `@repo/api-kernel` port tokens. The full composition map —
6 dependency layers from the `audit`/`users` foundations up to `auth`/`sso` —
is diagrammed in [`architecture/feature-dependency-graph.md`](./architecture/feature-dependency-graph.md).

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
3. **RLS** — PostgreSQL row-level security via `TenantContextService`, on the
   subset of tables that carry a tenant column (see below)

**RLS is a partial defense layer, not a universal one.** A table gets a
`<base>_tenant_isolation` policy (`ENABLE` + `FORCE`) **only** when both hold:

- it carries `organization_id`, and
- every read/write happens inside a tenant context.

Tables read *before* a tenant context exists are deliberately exempt, because a
tenant predicate would hide the very rows used to establish that context:
`m_organizations`, `m_users`, `r_organization_members`, `m_roles`,
`r_user_roles`, `t_sso_session_exchanges`. They rely on application-level
scoping instead (`resolveUsersListOrganizationId`, `assertActorHasOrganizationContext`,
`assertUserBelongsToOrganization`, the `check_user_role_scope()` trigger).
Tables with no tenant column at all (`t_auth_sessions`, `m_user_preferences`, …)
are user-scoped and out of scope for RLS.

Current coverage: **16 of the 38 tables** — `l_activities`, `l_audit_logs`,
`m_files`, `r_attachments`, `r_job_dependencies`, `t_export_jobs`,
`t_file_batch_operations`, `t_file_versions`, `t_import_jobs`,
`t_mail_deliveries`, `t_notifications`, `w_job_attempts`, `w_job_events`,
`w_jobs`, `w_notification_jobs`, `w_outbox_messages`. The authoritative list,
the predicate shape and the compensating controls live in
[`database.md`](./database.md) → "Row-level security coverage" / "Tables
deliberately outside RLS".

**Tenant rule (HTTP layer):** for controller-served requests the `organizationId`
used for RLS comes from the authenticated session user, never from
client-supplied body fields. This does **not** generalise to internal call
boundaries: kernel/feature ports take `organizationId` as an explicit input
(e.g. `ActivityEmitter.emit({ organizationId, … })`), so a caller that gets it
wrong writes into another tenant's rows. Those ports are therefore expected to
carry a fail-closed invariant against the active tenant context — for activities
this is `assertActivityOrganizationInTenant()`
(`packages/feature-activities/src/application/use-cases/emit-activity.use-case.ts`),
which throws `403` when an explicit `organizationId` disagrees with the active
tenant and only lets platform/`bypassRls` callers pass through.

**Organization model:** the platform composes one of two organization-model
capabilities (see `docs/database.md` → "Organization model modes"). In the
default `personal-orgs` model every user is provisioned a personal organization;
in the `org-optional` model users may operate without any organization — their
session `organizationId` is `null` and their tenant-scoped rows carry the
platform-scope sentinel, isolated by user-scoped RLS branches (migration `0038`).

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

Feature packages that own real business rules keep them in a framework-free
`packages/feature-<id>/src/domain/` directory — including nested slices such as
`packages/feature-upload/src/files/domain/` (jobs lifecycle, upload policy,
identity policies). Criteria: `docs/adr/0001-domain-layer-criteria.md`; purity is
enforced by `scripts/check-domain-purity.mjs`, which runs as part of
`scripts/check-source-policy.sh` (`pnpm lint:policy`, and therefore `pnpm lint`).

Cross-feature integration follows the port-token pattern (see
[ADR 0004](./adr/0004-decouple-sso-from-auth-session-issuance-port.md) for the
SSO → auth session-issuance proposal and
[`architecture/feature-dependency-graph.md`](./architecture/feature-dependency-graph.md)
for the kernel-owned ports already in place).

## Redis

`REDIS_URL` is optional in development/test (in-memory fallbacks). In production it is required for distributed rate limiting and shared access-profile cache.

## Flutter Architecture

- `core/`: configuration, network, storage, auth helpers, shared widgets
- `features/`: auth, notifications, organizations, profile, home, activities,
  attachments, files, gallery, imports, exports
- `generated/api/`: OpenAPI Dart Dio client

The Flutter app stores tokens in secure storage and uses a single-flight refresh path in the Dio interceptor.

## Cross-feature port tokens

Cross-feature calls resolve a `Symbol` token, never a concrete class. A token is
declared exactly once, in the owning package, and re-exported next to its
interface (`public/<name>.port.ts`) plus through the package's
`public/contracts.ts`. Kernel-owned tokens live in
`@repo/api-kernel/src/ports/<name>.port.ts`; feature-owned tokens live in
`packages/feature-<id>/src/public/<name>.token.ts`.

| Token                      | Declared in                                                          | Bound in               | Purpose                                     |
| -------------------------- | -------------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| `MAIL_TEMPLATE_SENDER`     | `@repo/api-kernel` (`ports/mail-template-sender.port.ts`)             | `MailModule`           | Send templated email                        |
| `USER_NOTIFICATION_SENDER` | `@repo/feature-notifications` (`public/user-notification-sender.token.ts`) | `NotificationsModule`  | Send user notifications from jobs/workflows |
| `AUDIT_WRITER`             | `@repo/feature-audit` (`public/audit-writer.token.ts`)                | `AuditCoreModule`      | Append audit log entries                    |
| `BACKGROUND_JOB_ENQUEUER`  | `@repo/feature-jobs` (`public/background-job-enqueuer.token.ts`)      | `JobsModule`           | Enqueue background jobs                     |
| `ORGANIZATION_LOOKUP`      | `@repo/feature-organizations` (`public/organization-lookup.token.ts`) | `OrganizationsModule`  | Resolve organization metadata               |
| `USER_LOOKUP`              | `@repo/feature-users` (`public/user-lookup.token.ts`)                 | `UsersModule`          | Resolve user metadata                       |

## Contract generation

After controller/DTO changes, run `pnpm generate` to regenerate OpenAPI and TypeScript/Dart clients. Do not hand-edit generated mobile Dart files.
