ALTER TABLE "jobs" ADD COLUMN "result" jsonb;--> statement-breakpoint
CREATE INDEX "jobs_claim_idx" ON "jobs" USING btree ("status","run_at");