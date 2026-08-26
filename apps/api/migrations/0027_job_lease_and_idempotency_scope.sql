-- J-001: Add lease columns to jobs for stale PROCESSING recovery (T-002)
ALTER TABLE "jobs" ADD COLUMN "processing_started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "lease_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "worker_id" text;
--> statement-breakpoint
CREATE INDEX "jobs_status_lease_idx" ON "jobs" USING btree ("status", "lease_expires_at")
  WHERE status = 'PROCESSING';
--> statement-breakpoint
-- J-002: Broaden idempotency-key constraint to include organizationId (T-005)
DROP INDEX "jobs_created_by_idempotency_key_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_org_created_by_idempotency_key_unique"
  ON "jobs" ("organization_id", "created_by_id", "idempotency_key")
  WHERE idempotency_key IS NOT NULL;
--> statement-breakpoint
-- J-003: Add BLOCKED status to the job status enum (T-007)
ALTER TYPE "job_status" ADD VALUE 'BLOCKED' AFTER 'FAILED';
--> statement-breakpoint
-- J-004: Add source_job_id to mail_deliveries for idempotent mail tracking (T-006)
ALTER TABLE "mail_deliveries" ADD COLUMN "source_job_id" uuid REFERENCES "jobs"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX "mail_deliveries_source_job_id_idx" ON "mail_deliveries" USING btree ("source_job_id");
