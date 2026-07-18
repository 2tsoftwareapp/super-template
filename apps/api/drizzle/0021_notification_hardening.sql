ALTER TABLE "notifications" ADD COLUMN "source_job_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_source_job_id_notification_jobs_id_fk" FOREIGN KEY ("source_job_id") REFERENCES "public"."notification_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_org_user_created_idx" ON "notifications" USING btree ("organization_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_org_user_unread_idx" ON "notifications" USING btree ("organization_id","user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_source_job_id_user_id_unique" ON "notifications" USING btree ("source_job_id","user_id") WHERE "notifications"."source_job_id" is not null;
