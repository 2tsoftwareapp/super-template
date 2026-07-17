-- Additional indexes for audit_logs query performance at scale.
-- The migration runner wraps the file in a single transaction, so CONCURRENTLY
-- is intentionally omitted (it is incompatible with transactional DDL).

--> statement-breakpoint

-- Composite index for tenant-scoped listing (the most common query path).
CREATE INDEX IF NOT EXISTS "audit_logs_org_created_idx"
  ON "audit_logs" ("organization_id", "created_at" DESC, "id" DESC);

-- Composite index for tenant-scoped action-filtered queries (export, search).
CREATE INDEX IF NOT EXISTS "audit_logs_org_action_created_idx"
  ON "audit_logs" ("organization_id", "action", "created_at" DESC);

-- B-tree index for exact request-ID lookup (debugging / support).
CREATE INDEX IF NOT EXISTS "audit_logs_request_id_idx"
  ON "audit_logs" ("request_id");

-- Index for purge queries that scan by creation time.
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_id_idx"
  ON "audit_logs" ("created_at", "id");
