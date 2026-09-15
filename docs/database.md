# Database

## Schema Conventions

- PostgreSQL
- `snake_case` identifiers
- UUID primary keys (see the natural-key exceptions below)
- `timestamptz` for timestamps
- UTC storage
- explicit indexes and unique constraints
- soft deletion only where business recovery matters
- physical table names carry a lifecycle prefix — see
  [`architecture/NAMING_CONVENTIONS.md`](./architecture/NAMING_CONVENTIONS.md) §2

### Primary keys

The default is `uuid("id").defaultRandom().primaryKey()`. Four tables use a
natural key instead, because the natural key already has 1:1 or 1-per-scope
cardinality:

| Table | Primary key | Why |
| --- | --- | --- |
| `m_user_preferences` | `user_id` | exactly one row per user |
| `m_user_two_factor_secrets` | `user_id` | exactly one row per user |
| `m_application_settings` | `key` | key/value settings row identified by its key |
| `t_storage_objects` | `storage_key` | the object key is the natural identity |

Junction (`r_`) tables use a composite primary key of their two foreign keys and
carry no `id` (e.g. `r_user_roles` on `(user_id, role_id)`).

## Tables (38 total)

Names below are the **physical SQL table names**. Drizzle symbols stay
unprefixed camelCase (`m_users` → `users`).

### Identity (18)

- `m_users` — core user accounts with email, password hash, avatar, status
- `t_auth_sessions` — refresh-token-backed login sessions
- `t_email_verification_tokens` — single-use email verification
- `t_password_reset_tokens` — single-use password reset
- `m_organizations` — multi-tenant organization root
- `r_organization_members` — membership bridge between users and orgs
- `m_roles` — named role templates (scoped to org or platform)
- `m_permissions` — named permission definitions
- `r_user_roles` — role assignments (with optional org scope)
- `r_role_permissions` — permission grants on roles
- `m_user_two_factor_secrets` — encrypted TOTP secrets
- `t_user_recovery_codes` — one-time recovery codes for 2FA
- `t_mfa_challenges` — MFA challenge tracking (attempts, expiry)
- `r_external_identities` — SSO/OIDC provider links (Google, Apple, GitHub, etc.)
- `t_sso_login_states` — short-lived PKCE state records for SSO flows
- `t_sso_session_exchanges` — one-time code exchange records for SSO callback
- `m_user_preferences` — per-user theme, language, timezone, notification prefs
- `w_outbox_messages` — outbox for outbound integration events

### Platform (20)

- `l_audit_logs` — append-only action log
- `m_files` — file/object storage metadata
- `t_file_versions` — version history for files
- `t_file_batch_operations` — bulk file operation tracking
- `r_attachments` — polymorphic file attachments to any entity
- `t_storage_objects` — stored object tracking keyed by storage key
- `w_storage_delete_outbox` — queued storage deletions awaiting the worker
- `w_jobs` — PostgreSQL-backed background job queue
- `w_job_attempts` — per-attempt tracking for retries
- `w_job_events` — event log for job lifecycle
- `r_job_dependencies` — directed dependency edges between jobs
- `t_import_jobs` — CSV/data import jobs
- `t_export_jobs` — CSV/data export jobs
- `t_mail_deliveries` — transactional email delivery log
- `m_application_settings` — key/value app-wide settings
- `t_notifications` — notification records addressed to users
- `t_notification_deliveries` — per-notification delivery tracking
- `m_notification_device_tokens` — FCM push notification tokens
- `w_notification_jobs` — scheduled/sent notification jobs
- `l_activities` — user activity event log

## Row-level security coverage

16 of the 38 tables are tenant-isolated by PostgreSQL RLS. Each is `ENABLE`d
**and** `FORCE`d, with exactly one policy named `<base>_tenant_isolation`
(policy names keep the pre-prefix base name, because policies bind by table OID):

`l_activities`, `l_audit_logs`, `m_files`, `r_attachments`,
`r_job_dependencies`, `t_export_jobs`, `t_file_batch_operations`,
`t_file_versions`, `t_import_jobs`, `t_mail_deliveries`, `t_notifications`,
`w_job_attempts`, `w_job_events`, `w_jobs`, `w_notification_jobs`,
`w_outbox_messages`.

`t_mail_deliveries` (migration `0041`) and `w_outbox_messages` (migration `0042`)
joined the list during the 2026-09 audit remediation; both keep an explicit
`organization_id IS NULL` branch for rows produced before a tenant context
exists (auth mail dispatched by the outbox worker, pre-migration rows).

Policy predicate:

```sql
organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
OR current_setting('app.bypass_rls', true) = 'true'
```

In the **org-optional** organization model, migration
`0038_org_optional_user_scoped_rls.sql` rewrites every tenant-isolation policy to
add a third branch so organization-less (platform-scope) rows stay private to
their owner:

```sql
organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    AND <owner column> = NULLIF(current_setting('app.user_id', true), '')::uuid)
OR current_setting('app.bypass_rls', true) = 'true'
```

`<owner column>` is the row's user attribution column (`actor_id`,
`created_by_id`, `uploaded_by_id`, or `user_id`). The job-observability child
tables (`w_job_attempts`, `w_job_events`, `r_job_dependencies`) have no owner
column; migration `0040_job_child_tables_sentinel_scoping.sql` scopes their
sentinel branch through the parent job's `w_jobs.created_by_id` via an
`EXISTS` subquery. Platform-scope rows are
written with the sentinel organization id `00000000-0000-0000-0000-000000000000`
(see `PLATFORM_SCOPE_ORGANIZATION_ID` in `@repo/api-kernel`), so real tenant
rows and personal rows never mix, and org-less users can never read each
other's data at the database level. `l_audit_logs` additionally allows
`organization_id IS NULL` so platform-wide audit rows remain visible.

### Tables deliberately outside RLS

Four tables carry `organization_id` but must **not** be RLS-scoped. Each is read
during a flow that runs *before* a tenant context exists, so an RLS predicate
would hide the very rows used to establish that context:

| Table | Why it cannot be RLS-scoped |
| --- | --- |
| `r_organization_members` | `listForUser(userId)` / `findPrimaryOrganizationId(userId)` resolve which orgs a user belongs to — the query that produces the tenant id |
| `t_sso_session_exchanges` | the SSO callback redeems a one-time code by `code_hash` before any tenant is known |
| `m_roles` | platform-level roles have `organization_id IS NULL`; a tenant predicate would hide every platform role |
| `r_user_roles` | platform-level assignments are also `organization_id IS NULL`, and roles resolve during authorization |

Compensating controls: application-level org scoping
(`resolveUsersListOrganizationId`, `assertActorHasOrganizationContext`,
`assertUserBelongsToOrganization` in `feature-user-management`), plus the
`check_user_role_scope()` trigger, which rejects a `r_user_roles` row whose
`organization_id` disagrees with its `m_roles` row.

`m_organizations` and `m_users` are also outside RLS — they are the tenant root
and the global identity table. Security-sensitive reads of them are pinned to
the primary connection (see the read-replica section below).

That accounts for 6 of the 22 tables outside RLS: the four exemptions above plus
the tenant root `m_organizations` and the global identity table `m_users`. The
remaining 16 carry no `organization_id` at all, so tenant scoping does not apply
— global reference data (`m_permissions`, `m_application_settings`), user-scoped
records (`t_auth_sessions`, `m_user_preferences`, `m_user_two_factor_secrets`,
`t_mfa_challenges`, `t_user_recovery_codes`, `t_email_verification_tokens`,
`t_password_reset_tokens`, `t_sso_login_states`, `r_external_identities`,
`t_notification_deliveries`, `m_notification_device_tokens`), storage
bookkeeping (`t_storage_objects`, `w_storage_delete_outbox`) and the
role-permission junction (`r_role_permissions`). Where those rows are user-owned,
isolation comes from explicit `user_id` predicates in the query, not from a
policy.

## Migration Workflow

1. Edit feature schema under `packages/feature-*/src/infrastructure/persistence/`
2. Run `make db-generate` (`node scripts/db-generate.mjs`)
3. Review generated SQL under `apps/api/migrations/`
4. Run `make db-migrate` (uses `DATABASE_MIGRATE_URL` or `POSTGRES_*` admin credentials)
5. Run `make db-seed` if needed

`db:push` is available only as a local convenience and is not part of CI or production workflow.

### How the history is stored

This repository keeps **two** records of the migration history, and
`scripts/db-generate.mjs` keeps them in sync so you never edit them by hand:

| File | Owner | Purpose |
| --- | --- | --- |
| `apps/api/migrations/*.sql` | runtime (`apps/api/src/cli/migrations.ts`) | the actual applied history, applied in filename order |
| `meta/_journal.json` | drizzle-kit | numbering for the next generated migration |
| `meta/NNNN_snapshot.json` | drizzle-kit | schema state the next migration diffs against |
| `meta/_legacy-journal-map.json` | `check-schema.mjs` | filename ledger; every SQL file must be listed |
| `meta/_migration-integrity.json` | `check-schema.mjs` | SHA-256 checksums; the history is append-only |

Two rules follow from this and are enforced by
`scripts/__tests__/migration-tooling.spec.mjs` and `scripts/check-schema.mjs`:

- **Every file in `meta/` that drizzle-kit should not parse must start with `_`.**
  drizzle-kit treats every other entry as a Drizzle snapshot and aborts with
  `data is malformed`.
- **`meta/_journal.json` must end at or above the highest `NNNN_` prefix in the
  ledger**, otherwise a generated migration reuses an existing number.

`drizzle.config.ts` deliberately globs only the canonical persistence entry
points (`persistence/index.ts`, plus `feature-outbox/.../outbox-messages.ts`).
A wider glob such as `persistence/**/*.ts` also pulls in repositories and DTOs,
and drizzle-kit then fails while bundling them with esbuild
(`Parameter decorators only work when experimental decorators are enabled`).

## Application Database Role

Tenant isolation depends on Postgres row-level security. Superusers and roles with `BYPASSRLS` ignore every policy, including `FORCE ROW LEVEL SECURITY`.

- **`DATABASE_URL`** — restricted primary runtime role used by the API and worker (`fullstack_starter_app` in local `.env.example`). The runtime refuses to boot when this connection is superuser or `BYPASSRLS`.
- **`DATABASE_URL_READ_REPLICA`** — optional restricted runtime role for the selected read-replica endpoint. The same RLS capability check runs against this pool; a superuser or `BYPASSRLS` replica role also fails startup.
- **`DATABASE_MIGRATE_URL`** — privileged role for `db:migrate`, `db:reset`, and Drizzle kit (`postgres` in local `.env.example`).
- Migration `0007_app_database_role.sql` provisions the application role and table grants on each database.

Production must create an equivalent non-superuser role, rotate its password, and keep migrations on a separate privileged connection.

## Tenant topology modes

The default deployment uses shared-schema tenancy: tenant-owned rows remain in
the public schema, and PostgreSQL RLS uses `app.tenant_id`, `app.user_id`, and
`app.bypass_rls` as the policy context. This remains the behavior when no
tenant capability is selected.

The package-level generator can select exactly one tenant capability:

```sh
node scripts/create-project.mjs --tenant-mode shared-schema --target ../my-app
node scripts/create-project.mjs --tenant-mode schema-per-tenant --target ../my-app
```

`schema-per-tenant` derives a safe schema name from a UUID, such as
`tenant_550e8400_e29b_41d4_a716_446655440000`, and applies
`search_path = tenant_<uuid>, public` for a tenant context. A missing tenant
context uses `public` only, and a non-UUID tenant id fails before SQL runs.
The generator does not create schemas, grant access, or fan out migrations;
operators must provision each tenant schema and apply compatible DDL before
enabling this mode in a deployed environment.

## Organization model modes

Two mutually exclusive capabilities select how users relate to organizations:

```sh
node scripts/create-project.mjs --org-model personal-orgs --target ../my-app
node scripts/create-project.mjs --org-model org-optional --target ../my-app
```

| Capability | id | Behavior |
| --- | --- | --- |
| `feature-org-model-personal-orgs` | `org-model-personal-orgs` | Historical default. Registration, SSO signup, and platform user creation provision a personal organization + ADMIN role for every user; sessions without an organization are rejected (`403`). |
| `feature-org-model-optional` | `org-model-optional` | Organizations become an opt-in module. New users have **no** organization; `organizationId` is `null` in sessions/tokens and tenant-scoped writes use the platform-scope sentinel. Tenant-scoped endpoints that require an organization keep returning `403` until the user joins one. |

Selecting both is a composition error (same conflict mechanism as tenant
modes). The composed value flows to every host through `organizationModelOptions`
(`@repo/app-composition`) → `DatabaseModule.forRoot({ organizationModel })` →
`ORGANIZATION_MODEL_OPTIONS` (`@repo/database-runtime`).

User-scoped data isolation in the org-optional model is enforced by the RLS
policies installed in migration `0038` (see "Row-level security coverage"
above). Both tenant topology modes can be combined with either organization
model.

## Read-replica topology

Select the independent read-replica capability with `--read-replica` or by
checking `database-read-replica` in the package selector:

```sh
node scripts/create-project.mjs \
  --tenant-mode shared-schema \
  --read-replica \
  --target ../my-app
```

Configure `DATABASE_URL_READ_REPLICA` for runtime and
`DATABASE_URL_TEST_READ_REPLICA` for test runs. The selected capability fails
startup when the relevant URL is absent. Both URLs should use a restricted
database role and TLS settings appropriate to the environment. The primary and
replica URLs are independent endpoints; primary port discovery in
`@repo/env-loader` does not rewrite either replica host or port.

Drizzle select/query/count helpers use the replica with eventual consistency.
Inserts, updates, deletes, raw `execute`, transactions, migrations, and
advisory locks stay on the primary. Security-sensitive auth session, user,
organization, access-control, and MFA repositories resolve the primary through
the exported `getPrimaryDatabaseClient()` helper, so revocation, rotation,
status, and permission decisions do not depend on replica lag. There is no automatic failover or
general read-your-writes guarantee for eventual consumers in this version.

`readConsistency: "strong"` cannot be composed with `readReplica: true`; the
feature manifest resolver rejects that combination before runtime startup.
Strong reads must use the primary client, while explicit eventual consumers
continue using the default `DATABASE` client.

## Topology integration test

`apps/api/test/database-topology.e2e.spec.ts` is an opt-in real-PostgreSQL
suite. It requires a migrated primary/replica pair using restricted roles plus
`DATABASE_TOPOLOGY_ADMIN_URL` targeting the primary for temporary probe-table
setup and cleanup:

```bash
DATABASE_TOPOLOGY_PRIMARY_URL='postgresql://app@primary/app' \
DATABASE_TOPOLOGY_REPLICA_URL='postgresql://app@replica/app' \
DATABASE_TOPOLOGY_ADMIN_URL='postgresql://admin@primary/app' \
pnpm --filter api exec vitest run test/database-topology.e2e.spec.ts
```

The test covers tenant A/B isolation on both endpoints, independent endpoint
configuration, immediate primary visibility after auth rotation/revocation,
and an optional privileged replica-role failure using
`DATABASE_TOPOLOGY_PRIVILEGED_REPLICA_URL`. If the three required topology
URLs are unset, Vitest skips the file; the optional negative test is skipped
when its URL is unset. This repository's Docker Compose file provides a
development PostgreSQL primary but does not provision a read-replica service,
so a live replica remains an environment prerequisite rather than a claim of
local test success. Source: `apps/api/test/database-topology.e2e.spec.ts`,
`infra/docker-compose.yml`.

The live topology suite is opt-in because it requires a separately reachable
replica and a restricted test role on both endpoints. Its switch is the presence
of the three `DATABASE_TOPOLOGY_*` URLs shown above — there is no separate
enable flag, and invoking the file without them reports it as skipped:

```sh
pnpm --filter api exec vitest run test/database-topology.e2e.spec.ts
```

`DATABASE_URL_TEST_READ_REPLICA` is a different knob: it is what
`database.provider.ts` needs when the composed application itself composes
`readReplica: true` in a test environment, and the topology spec does not read
it. Without the external PostgreSQL endpoints, the deterministic provider,
environment, and unit tests are the available verification boundary.

## Transaction Convention

- Repositories accept the default database client or an existing transaction executor
- Related operations stay inside a single transaction when consistency matters
- Examples:
  - user creation plus notification creation
  - user blocking plus session revocation plus audit logging

## Seed Workflow

- Seeds are idempotent
- Roles and permissions are inserted or reused
- role-permission mappings are reconciled
- admin and regular users are inserted or reused
- sample seed data is inserted for development
- `db:seed` and `db:reset` refuse `APP_ENV=staging|production` unless `ALLOW_PROD_SEED=1` / `ALLOW_PROD_RESET=1` is set

## Soft Delete Strategy

- `users.deleted_at` supports safe uniqueness and future recovery workflows
- `organizations.deleted_at` supports slug reclamation and restore
- `files.deleted_at` and `attachments.deleted_at` support soft-remove before hard cleanup
- Auth, token, and queue tables do not use soft delete

## Indexing Strategy

- foreign key columns have explicit indexes
- list-heavy filters have dedicated indexes
- active email uniqueness is enforced through a partial unique index
- soft-deleted entities are scoped for uniqueness on active rows only
- organization slug uniqueness is enforced through a partial unique index
- role names are unique per-organization (and globally for platform-level roles)
- composite unique indexes on junction tables prevent duplicate relationships
