DROP INDEX IF EXISTS "notification_jobs_actor_idempotency_key_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "notification_jobs_org_actor_idempotency_key_unique" ON "notification_jobs" USING btree ("organization_id","actor_id","idempotency_key") WHERE "notification_jobs"."idempotency_key" is not null;
