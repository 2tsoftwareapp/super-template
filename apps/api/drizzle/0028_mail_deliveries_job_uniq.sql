-- M-001: Add unique index on mail_deliveries (source_job_id, recipient) for idempotent job-triggered mail (R2-004)
--> statement-breakpoint
CREATE UNIQUE INDEX "mail_deliveries_job_recipient_uniq" ON "mail_deliveries" USING btree ("source_job_id", "recipient");
