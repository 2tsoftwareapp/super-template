-- N-001: Add source_background_job_id to notifications for general-job idempotency (R3-H-002)
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "source_background_job_id" uuid REFERENCES "jobs"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_source_bg_job_id_user_id_unique" ON "notifications" USING btree ("source_background_job_id", "user_id") WHERE source_background_job_id IS NOT NULL;
