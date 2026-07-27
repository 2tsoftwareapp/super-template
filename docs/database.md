# Database

## Schema Conventions

- PostgreSQL
- `snake_case` identifiers
- UUID primary keys
- `timestamptz` for timestamps
- UTC storage
- explicit indexes and unique constraints
- soft deletion only where business recovery matters

## Tables (30 total)

### Identity (17)

- `users` — core user accounts with email, password hash, avatar, status
- `auth_sessions` — refresh-token-backed login sessions
- `email_verification_tokens` — single-use email verification
- `password_reset_tokens` — single-use password reset
- `organizations` — multi-tenant organization root
- `organization_members` — membership bridge between users and orgs
- `roles` — named role templates (scoped to org or platform)
- `permissions` — named permission definitions
- `user_roles` — role assignments (with optional org scope)
- `role_permissions` — permission grants on roles
- `user_two_factor_secrets` — encrypted TOTP secrets
- `user_recovery_codes` — one-time recovery codes for 2FA
- `mfa_challenges` — MFA challenge tracking (attempts, expiry)
- `external_identities` — SSO/OIDC provider links (Google, Apple, GitHub, etc.)
- `sso_login_states` — short-lived PKCE state records for SSO flows
- `sso_session_exchanges` — one-time code exchange records for SSO callback
- `user_preferences` — per-user theme, language, timezone, notification prefs

### Platform (13)

- `audit_logs` — append-only action log
- `files` — file/object storage metadata
- `file_versions` — version history for files
- `file_batch_operations` — bulk file operation tracking
- `attachments` — polymorphic file attachments to any entity
- `jobs` — PostgreSQL-backed background job queue
- `job_attempts` — per-attempt tracking for retries
- `job_events` — event log for job lifecycle
- `job_dependencies` — directed dependency edges between jobs
- `import_jobs` — CSV/data import jobs
- `export_jobs` — CSV/data export jobs
- `mail_deliveries` — transactional email delivery log
- `application_settings` — key/value app-wide settings

### Platform (additional)

Notes: `notifications`, `notification_device_tokens`, `notification_jobs`, and `activities` are included in the Platform domain above (see notifications and activities modules). The workspace domain (projects, invitations, comments) has been removed from the template.

## Migration Workflow

1. Edit `packages/api-database/src/schema.ts`
2. Run `make db-generate`
3. Review generated SQL under `apps/api/drizzle/`
4. Run `make db-migrate` (uses `DATABASE_MIGRATE_URL` or `POSTGRES_*` admin credentials)
5. Run `make db-seed` if needed

`db:push` is available only as a local convenience and is not part of CI or production workflow.

## Application Database Role

Tenant isolation depends on Postgres row-level security. Superusers and roles with `BYPASSRLS` ignore every policy, including `FORCE ROW LEVEL SECURITY`.

- **`DATABASE_URL`** — restricted runtime role used by the API (`fullstack_starter_app` in local `.env.example`). The API refuses to boot when this connection is superuser or `BYPASSRLS`.
- **`DATABASE_MIGRATE_URL`** — privileged role for `db:migrate`, `db:reset`, and Drizzle kit (`postgres` in local `.env.example`).
- Migration `0007_app_database_role.sql` provisions the application role and table grants on each database.

Production must create an equivalent non-superuser role, rotate its password, and keep migrations on a separate privileged connection.

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
