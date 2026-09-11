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

14 of the 38 tables are tenant-isolated by PostgreSQL RLS. Each is `ENABLE`d
**and** `FORCE`d, with exactly one policy named `<base>_tenant_isolation`
(policy names keep the pre-prefix base name, because policies bind by table OID):

`l_activities`, `l_audit_logs`, `m_files`, `r_attachments`,
`r_job_dependencies`, `t_export_jobs`, `t_file_batch_operations`,
`t_file_versions`, `t_import_jobs`, `t_notifications`, `w_job_attempts`,
`w_job_events`, `w_jobs`, `w_notification_jobs`.

Policy predicate:

```sql
organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
OR current_setting('app.bypass_rls', true) = 'true'
```

`l_audit_logs` additionally allows `organization_id IS NULL` so platform-wide
audit rows remain visible.

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

## Migration Workflow

1. Edit feature schema under `packages/feature-*/src/infrastructure/persistence/`
2. Run `make db-generate` (`pnpm --filter @repo/database-runtime db:generate`)
3. Review generated SQL under `apps/api/migrations/`
4. Run `make db-migrate` (uses `DATABASE_MIGRATE_URL` or `POSTGRES_*` admin credentials)
5. Run `make db-seed` if needed

`db:push` is available only as a local convenience and is not part of CI or production workflow.

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
organization, access-control, and MFA repositories use the exported
`DATABASE_PRIMARY` client, so revocation, rotation, status, and permission
decisions do not depend on replica lag. There is no automatic failover or
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
replica and a restricted test role on both endpoints. Invoke Vitest directly so
only that spec runs, and set `DATABASE_URL_TEST_READ_REPLICA` alongside
`DATABASE_URL_TEST`:

```sh
RUN_DATABASE_TOPOLOGY_E2E=1 pnpm --filter api exec vitest run test/database-topology.e2e.spec.ts
```

Without those external PostgreSQL endpoints, the deterministic provider,
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
