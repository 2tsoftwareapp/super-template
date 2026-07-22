-- N-001: Track processing attempts on notification_jobs so stale recovery can
--        distinguish retryable jobs from exhausted ones.
ALTER TABLE "notification_jobs" ADD COLUMN "attempts" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE INDEX "notification_jobs_processing_updated_idx"
  ON "notification_jobs" ("status", "updated_at")
  WHERE status = 'PROCESSING';
--> statement-breakpoint
-- N-002: Change the unique constraint on notification_device_tokens from a
--        global unique-token index to a partial active-token index.
--        registerOrTransfer() inserts a new row with a new UUID when a token is
--        claimed by a different user. The old (disabled) row keeps the token
--        string so the history is auditable, but the full-table unique index
--        would reject the second INSERT.
DROP INDEX "notification_device_tokens_token_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "notification_device_tokens_active_token_unique"
  ON "notification_device_tokens" ("token")
  WHERE disabled_at IS NULL;
