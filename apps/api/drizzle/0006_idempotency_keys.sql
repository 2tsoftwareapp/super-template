ALTER TABLE "import_jobs" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "import_jobs_created_by_idempotency_key_unique" ON "import_jobs" USING btree ("created_by_id","idempotency_key") WHERE "idempotency_key" is not null;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "export_jobs_created_by_idempotency_key_unique" ON "export_jobs" USING btree ("created_by_id","idempotency_key") WHERE "idempotency_key" is not null;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_created_by_idempotency_key_unique" ON "jobs" USING btree ("created_by_id","idempotency_key") WHERE "idempotency_key" is not null;--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_jobs_actor_idempotency_key_unique" ON "notification_jobs" USING btree ("actor_id","idempotency_key") WHERE "idempotency_key" is not null;
