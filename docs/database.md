# Database

## Schema Conventions

- PostgreSQL
- `snake_case` identifiers
- UUID primary keys
- `timestamptz` for timestamps
- UTC storage
- explicit indexes and unique constraints
- soft deletion only where business recovery matters

## Main Tables

- `users`
- `auth_sessions`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `email_verification_tokens`
- `password_reset_tokens`
- `projects`
- `notifications`
- `audit_logs`

## Migration Workflow

1. Edit `packages/api-database/src/schema.ts`
2. Run `make db-generate`
3. Review generated SQL under `apps/api/drizzle/`
4. Run `make db-migrate`
5. Run `make db-seed` if needed

`db:push` is available only as a local convenience and is not part of CI or production workflow.

## Transaction Convention

- Repositories accept the default database client or an existing transaction executor
- Related operations stay inside a single transaction when consistency matters
- Examples:
  - project creation plus notification creation
  - user blocking plus session revocation plus audit logging

## Seed Workflow

- Seeds are idempotent
- Roles and permissions are inserted or reused
- role-permission mappings are reconciled
- admin and regular users are inserted or reused
- sample projects and notifications are inserted for development

## Soft Delete Strategy

- `users.deleted_at` supports safe uniqueness and future recovery workflows
- `projects.deleted_at` supports restore behavior
- auth and token tables do not use soft delete

## Indexing Strategy

- foreign key columns have explicit indexes
- list-heavy filters have dedicated indexes
- active email uniqueness is enforced through a partial unique index
- project uniqueness is scoped to owner and active rows
