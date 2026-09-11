# Super Template — Naming Conventions

Status: **Canonical**
Audience: humans, Codex, Claude Code, and other AI agents
Applies to: backend (NestJS), web + admin (Next.js), mobile (Flutter), and PostgreSQL/Drizzle

---

## 1. Purpose

This document is the single naming standard applied consistently across **all**
platforms in `super-template`: one PostgreSQL schema, one OpenAPI contract, and
four clients. It complements [`ARCHITECTURE_RULES.md`](./ARCHITECTURE_RULES.md),
which owns layering and dependency direction; this document owns **names**.

Two rules govern everything below:

1. **The Drizzle schema is the single source of truth for the database.** The
   physical SQL table name (the string passed to `pgTable("…")`) carries a
   category prefix; the TypeScript symbol and every API field stay clean domain
   names with no prefix.
2. **Names are chosen once and reused.** The same domain concept keeps the same
   clean name on every surface (SQL column → Drizzle field → DTO → generated
   contract → web/admin/Flutter), so a reader can predict a name in one platform
   from any other.

When this document conflicts with `ARCHITECTURE_RULES.md`, that document wins on
architecture; this one wins on naming detail.

---

## 2. Database table naming — category-prefix system

The **physical SQL table name** is classified by lifecycle/role and carries a
one-letter category prefix. This applies **only** to the SQL identifier. Drizzle
symbols (`users`, `userRoles`), repository methods, DTO fields, and API payloads
never carry the prefix.

| Prefix | Category               | Meaning                                                        |
| ------ | ---------------------- | -------------------------------------------------------------- |
| `m_`   | master                 | Reference/entity data with a long lifecycle                    |
| `t_`   | transaction            | Business events and operational records                        |
| `w_`   | work / queue           | Background jobs, outbox, async queues                          |
| `l_`   | log                    | Audit and activity logs (append-only history)                  |
| `r_`   | relation               | Junction / many-to-many mapping tables                         |

### 2.1 Choosing a prefix for a NEW table

Ask, in order — the first match wins:

1. Is it a **junction / mapping** table joining two entities (composite PK of the
   two foreign keys, no independent identity)? → `r_`
2. Is it an **append-only audit/activity log** (history you read, never mutate as
   business state)? → `l_`
3. Is it a **queue / work item / outbox** row consumed by a background worker
   (has a status the worker advances, retries, leases)? → `w_`
4. Is it an **operational record produced by a business event** (sessions,
   tokens, challenges, deliveries, per-run job records, versions)? → `t_`
5. Otherwise it is **reference/entity master data** with a long lifecycle. → `m_`

A table gets exactly one prefix. If a table looks like two categories, it is
usually modelled wrong — split it before prefixing it.

### 2.2 Full classification of the current 38 tables

Old SQL name → canonical prefixed name. Drizzle symbol shown for reference (it
stays unprefixed camelCase).

**`m_` — master (9)**

| SQL name (old)               | Prefixed name                  | Drizzle symbol           |
| ---------------------------- | ------------------------------ | ------------------------ |
| `users`                      | `m_users`                      | `users`                  |
| `organizations`              | `m_organizations`              | `organizations`          |
| `roles`                      | `m_roles`                      | `roles`                  |
| `permissions`                | `m_permissions`                | `permissions`            |
| `files`                      | `m_files`                      | `files`                  |
| `user_preferences`           | `m_user_preferences`           | `userPreferences`        |
| `user_two_factor_secrets`    | `m_user_two_factor_secrets`    | `userTwoFactorSecrets`   |
| `notification_device_tokens` | `m_notification_device_tokens` | `notificationDeviceTokens` |
| `application_settings`       | `m_application_settings`       | `applicationSettings`    |

**`t_` — transaction (15)**

| SQL name (old)               | Prefixed name                  | Drizzle symbol           |
| ---------------------------- | ------------------------------ | ------------------------ |
| `auth_sessions`              | `t_auth_sessions`              | `authSessions`           |
| `email_verification_tokens`  | `t_email_verification_tokens`  | `emailVerificationTokens`|
| `password_reset_tokens`      | `t_password_reset_tokens`      | `passwordResetTokens`    |
| `mfa_challenges`             | `t_mfa_challenges`             | `mfaChallenges`          |
| `user_recovery_codes`        | `t_user_recovery_codes`        | `userRecoveryCodes`      |
| `sso_login_states`           | `t_sso_login_states`           | `ssoLoginStates`         |
| `sso_session_exchanges`      | `t_sso_session_exchanges`      | `ssoSessionExchanges`    |
| `mail_deliveries`            | `t_mail_deliveries`            | `mailDeliveries`         |
| `notifications`              | `t_notifications`              | `notifications`          |
| `notification_deliveries`    | `t_notification_deliveries`    | `notificationDeliveries` |
| `import_jobs`                | `t_import_jobs`                | `importJobs`             |
| `export_jobs`                | `t_export_jobs`                | `exportJobs`             |
| `file_versions`             | `t_file_versions`             | `fileVersions`           |
| `file_batch_operations`      | `t_file_batch_operations`      | `fileBatchOperations`    |
| `storage_objects`            | `t_storage_objects`            | `storageObjects`         |

**`w_` — work / queue (6)**

| SQL name (old)          | Prefixed name             | Drizzle symbol      |
| ----------------------- | ------------------------- | ------------------- |
| `jobs`                  | `w_jobs`                  | `jobs`              |
| `job_attempts`          | `w_job_attempts`          | `jobAttempts`       |
| `job_events`            | `w_job_events`            | `jobEvents`         |
| `notification_jobs`     | `w_notification_jobs`     | `notificationJobs`  |
| `outbox_messages`       | `w_outbox_messages`       | `outboxMessages`    |
| `storage_delete_outbox` | `w_storage_delete_outbox` | `storageDeleteOutbox` |

**`l_` — log (2)**

| SQL name (old) | Prefixed name  | Drizzle symbol |
| -------------- | -------------- | -------------- |
| `audit_logs`   | `l_audit_logs` | `auditLogs`    |
| `activities`   | `l_activities` | `activities`   |

**`r_` — relation (6)**

| SQL name (old)         | Prefixed name            | Drizzle symbol       |
| ---------------------- | ------------------------ | -------------------- |
| `user_roles`           | `r_user_roles`           | `userRoles`          |
| `role_permissions`     | `r_role_permissions`     | `rolePermissions`    |
| `organization_members` | `r_organization_members` | `organizationMembers`|
| `external_identities`  | `r_external_identities`  | `externalIdentities` |
| `attachments`          | `r_attachments`          | `attachments`        |
| `job_dependencies`     | `r_job_dependencies`     | `jobDependencies`    |

> Only the string inside `pgTable("…")` changes. `export const users = pgTable("m_users", …)`
> keeps the symbol `users` and every field on it unchanged.

### 2.3 Column, key, and enum conventions (verified against the schema)

These reflect the current schema and are the standard for new columns:

- **Columns are `snake_case`** in SQL and `camelCase` as Drizzle fields:
  `password_hash` → `passwordHash`, `email_verified_at` → `emailVerifiedAt`.
- **Primary key is `id`** — `uuid("id").defaultRandom().primaryKey()`.
  Two documented exceptions:
  - **Junction (`r_`) tables** use a **composite primary key** of their two
    foreign keys instead (e.g. `primaryKey({ columns: [userId, roleId] })`) and
    carry no `id`.
  - **Four natural-key tables**, where the natural key already carries the right
    cardinality: `m_user_preferences` (`user_id`),
    `m_user_two_factor_secrets` (`user_id`), `m_application_settings` (`key`),
    `t_storage_objects` (`storage_key`).
- **Foreign keys are `<entity>_id`**: `user_id`, `organization_id`, `role_id`,
  `session_id`, `actor_id`, `created_by_id`.
- **Timestamps are `created_at` / `updated_at`**, both
  `timestamp(..., { withTimezone: true })`, sourced from the shared `timestamps`
  helper. Not every table has both: append-only `l_`/short-lived `t_` tables
  (e.g. `l_audit_logs`, `t_sso_login_states`) intentionally carry only
  `created_at`. Soft-delete uses `deleted_at`; other lifecycle timestamps follow
  the `<event>_at` shape (`email_verified_at`, `scheduled_at`, `completed_at`).
- **Enums are `<domain>_<attr>`** as the PostgreSQL type name, defined with
  `pgEnum` and an unprefixed camelCase symbol suffixed `Enum`:
  `pgEnum("user_status", …)` → `userStatusEnum`;
  `pgEnum("job_status", …)` → `jobStatusEnum`;
  `pgEnum("organization_member_role", …)` → `organizationMemberRoleEnum`;
  `pgEnum("notification_device_platform", …)` → `notificationDevicePlatformEnum`.
  Enum **values** are `UPPER_SNAKE_CASE` constants (`PENDING`, `ACTIVE`,
  `BLOCKED`).
- **Index / constraint names** describe the table and columns:
  `users_email_active_unique`, `jobs_status_scheduled_at_idx`,
  `audit_logs_org_created_idx`.

### 2.4 Row-level security — policy naming and coverage

RLS follows the table, so two rules hold:

- **Policy names keep the pre-prefix base name.** The policy on `m_files` is
  `files_tenant_isolation`; the policy on `w_jobs` is `jobs_tenant_isolation`.
  Migration `0037_table_naming_convention_prefixes.sql` renamed only the
  physical table — policies, indexes, and foreign keys bind by OID and were
  deliberately left alone. Do not "fix" these names to match the prefix; a
  rename would silently drop and recreate the policy.
- **Coverage is a deliberate subset, not all tables.** 14 of the 38 tables are
  `ENABLE`d **and** `FORCE`d with exactly one `<base>_tenant_isolation` policy.
  Four tables carry `organization_id` but are intentionally outside RLS because
  they are read *before* a tenant context exists — a tenant predicate would hide
  the very rows used to establish that context (`r_organization_members`,
  `t_sso_session_exchanges`, `m_roles`, `r_user_roles`). See
  [`docs/database.md`](../database.md) → "Tables deliberately outside RLS"
  for the rationale and the compensating controls.

---

## 3. Cross-platform code naming

One table, every surface. Clean domain names are shared end to end; only files
and symbols follow each language's idiom.

### 3.1 Unified naming table

| Concept                         | Convention                          | Example                                             | Where                       |
| ------------------------------- | ----------------------------------- | --------------------------------------------------- | --------------------------- |
| TypeScript file (default)       | `kebab-case.ts`                     | `create-user.use-case.ts`                           | backend + web/admin         |
| TypeScript class/type           | `PascalCase`                        | `CreateUserUseCase`, `UserResponseDto`              | backend + web/admin         |
| TypeScript function/variable    | `camelCase`                         | `normalizeEmail`, `usersApi`                        | backend + web/admin         |
| TypeScript constant             | `UPPER_SNAKE_CASE`                  | `USER_STATUS`, `DEFAULT_USERS_LIST_PARAMS`          | backend + web/admin         |
| DI token (Symbol)               | `UPPER_SNAKE_CASE`                  | `USER_REPOSITORY = Symbol("UserRepositoryPort")`    | backend                     |
| Nest use case                   | `*.use-case.ts` / `<Action>UseCase` | `block-user.use-case.ts` → `BlockUserUseCase`       | backend                     |
| Nest controller                 | `*.controller.ts` / `<Domain>Controller` | `auth.controller.ts` → `AuthController`        | backend                     |
| Nest module                     | `*.module.ts` / `<Domain>Module`    | `users.module.ts` → `UsersModule`                   | backend                     |
| Application service             | `*.service.ts` / `<Domain>Service`  | `mfa.service.ts` → `MfaService`                     | backend                     |
| Port (interface + token)        | `*.repository.port.ts` / `<Resource>RepositoryPort` | `user.repository.port.ts` → `UserRepositoryPort` | backend                |
| Repository (impl)               | `*.repository.ts` / `<Resource>Repository` | `users.repository.ts` → `UsersRepository`    | backend (no `drizzle-` prefix) |
| Adapter                         | `*.adapter.ts` / `<Service>Adapter` | `resend-email.adapter.ts` → `ResendEmailAdapter`    | backend                     |
| Entity / policy                 | `<domain>.entity.ts` / `<Domain>Entity` | `user.entity.ts` → `UserEntity`                 | backend domain              |
| DTO                             | `<action>-<feature>.dto.ts` / `<X>Dto` | `create-user.dto.ts` → `CreateUserDto`           | backend presentation        |
| Drizzle table symbol            | clean `camelCase`, **no** `db`/prefix | `userRoles`, `notificationDeliveries`             | `@repo/database-runtime`        |
| Drizzle enum symbol             | `camelCase` + `Enum`                | `jobStatusEnum`                                     | `@repo/database-runtime`        |
| Zod schema                      | `create<Resource>Schema` / `<x>.schemas.ts` | `createUserSchema`                          | web/admin `model/`          |
| FE api file / object            | `<feature>.api.ts` / `<feature>Api` | `users.api.ts` → `usersApi.list()`                  | web/admin `api/`            |
| FE query hook                   | `<feature>.queries.ts` / `use<Feature><Action>Query` | `useUsersListQuery`                | web/admin `api/`            |
| FE mutation hook                | `<feature>.mutations.ts` / `use<Action><Feature>` | `useCreateUser`                       | web/admin `api/`            |
| FE query-key factory            | `<feature>.query-keys.ts` / `<feature>Keys` | `usersKeys.list(params)`                    | web/admin `api/`            |
| FE controller hook              | `use-<feature>-<concern>-controller.ts` (kebab) | `use-users-list-controller.ts`          | web/admin `controllers/`    |
| FE screen                       | `<feature>-*-screen.tsx` / `-view.tsx` (kebab) | `users-list-screen.tsx`, `verify-email-view.tsx` | web/admin `screens/`  |
| FE UI component                 | `<feature>-*.tsx` (kebab) / `<X>View` etc. | `users-table.tsx` → `UsersTable`             | web/admin `ui/`             |
| Dart file                       | `snake_case.dart`                   | `auth_repository.dart`, `login_screen.dart`         | mobile                      |
| Dart class                      | `PascalCase`                        | `AuthRepository`, `LoginScreen`, `AuthSession`      | mobile                      |
| Feature plugin package          | `@repo/feature-<id>`                | `@repo/feature-audit`                               | `packages/features/<id>/`   |
| API route path                  | kebab-case, plural resources        | `/api/v1/admin/users`, `/api/v1/files/{id}/url`     | Nest controllers            |

### 3.2 TypeScript file vs symbol split

The **file** name is dot-suffixed by role and kebab-cased
(`create-user.use-case.ts`); the **class** it exports is `PascalCase`
(`CreateUserUseCase`). This holds for both backend and web/admin. Avoid
ambiguous names — `manager`, `handler`, `processor`, `helper`, `utils`,
`common`, `base-service` — unless the folder makes the responsibility
unmistakable.

### 3.3 Admin/web feature slice file naming

Mirror `apps/admin/AGENTS.md` and `apps/web/AGENTS.md` exactly:

- Files in **`api/`** and **`model/`** use **dot notation**: `users.api.ts`,
  `users.queries.ts`, `users.mutations.ts`, `users.query-keys.ts`,
  `users.types.ts`, `users.schemas.ts`, `users.search-params.ts`,
  `users.permissions.ts`, `users.constants.ts`.
- Files in **`controllers/`**, **`screens/`**, and **`ui/`** use **kebab-case**:
  `use-users-list-controller.ts`, `users-list-screen.tsx`, `users-table.tsx`,
  `create-user-drawer.tsx`.
- Query keys use the factory pattern in `api/<x>.query-keys.ts`
  (`usersKeys.all`, `usersKeys.list(params)`); mutations import the factory for
  invalidation and never retype the literal key.

### 3.4 Flutter / Dart layout

Features live under `apps/mobile/lib/features/<feature>/` with the
`data/` → `domain/` → `presentation/` split:

```text
apps/mobile/lib/features/<feature>/
├── data/            <feature>_repository.dart      (AuthRepository)
├── domain/          <feature>_<concept>.dart       (AuthSession, ActivitySummary)
└── presentation/    <feature>_screen.dart          (LoginScreen)
                     <feature>_controller.dart       (AuthController)
                     screens/<x>_screen.dart         (nested screens when many)
```

Files are `snake_case.dart`; classes are `PascalCase`. Generated Dart under
`apps/mobile/lib/generated/` is not hand-edited (see the OpenAPI pipeline).

### 3.5 Feature plugin package naming

Each extracted feature is a package `@repo/feature-<id>` at
`packages/features/<id>/`, where `<id>` is **kebab-case** and **equals the
`FeatureManifest.id`** exported from the package's `index.ts`
(`{ id, nestModule, schema?, permissions? }`). See
[ADR 0002](../adr/0002-feature-plugin-architecture.md) and
`ARCHITECTURE_RULES.md` §15.1. Frontend surfaces are exposed through per-surface
entrypoints (`./admin`, `./web`) and a Dart sub-package under the same package.

### 3.6 API routes

Routes are kebab-case with **plural** resource segments, mirroring existing
controllers (`@Controller("admin/users")`, `/api/v1/files/{id}/url`). Path
parameters are `{id}`/`{userId}`. The BFF mapping is fixed: `/api/v1/<rest>` →
`/api/bff/<rest>`. The OpenAPI contract is the source of truth for paths; web and
admin build URLs with `bffPath("/api/v1/…")` rather than hand-written strings.

---

## 4. How this is enforced

Naming is enforced by a mix of tooling and review:

- **`scripts/check-source-policy.sh`** — repo source-policy guard (run via
  `pnpm lint`). It rejects `@boundaries-ignore`, explicit `any`, `unknown`
  outside allowed boundaries, package `index.ts` files that export repositories,
  presentation importing `drizzle-orm`/infrastructure, application importing
  `drizzle-orm`/`express`/infrastructure/`@repo/database-runtime`, domain importing
  any framework, and non-route files under `app/**`.
- **Turborepo boundaries** — `layer:*` tags (`core`, `env`, `database`, `sort`,
  `contract`, and `feature` per ADR 0002) constrain which packages may depend on
  which, keeping `@repo/feature-<id>` packages off `apps/*` internals.
- **ESLint boundary rules** — `apps/admin/eslint.config.mjs` and
  `apps/web/eslint.config.mjs` enforce the app-router / features / ui / model
  layer separation (`admin/boundary-*`, `web/boundary-*`); the dot-notation vs
  kebab-case file naming inside a slice is review-enforced.
- **The Drizzle schema is the single source of truth for the database.** The
  `m_/t_/w_/l_/r_` physical-name prefix and the column/key/enum conventions are
  enforced by review against the schema in `@repo/database-runtime`, and by the
  generated OpenAPI contract keeping API field names aligned across all four
  clients. There is no second endpoint/table registry to drift from.

New code mirrors the golden reference features and the tables above rather than
inventing a new shape.
