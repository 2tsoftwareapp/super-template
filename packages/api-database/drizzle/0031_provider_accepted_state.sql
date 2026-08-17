-- R11-H-001: Add PROVIDER_ACCEPTED state for durable external-mail idempotency
-- After SMTP accepts the email, the row is marked PROVIDER_ACCEPTED even if
-- the fenced SENT update fails. This state is never auto-retried.
--> statement-breakpoint
ALTER TYPE mail_delivery_status ADD VALUE IF NOT EXISTS 'PROVIDER_ACCEPTED';
--> statement-breakpoint
-- provider_message_id: SMTP message-id for reconciliation / provider idempotency
ALTER TABLE "mail_deliveries" ADD COLUMN IF NOT EXISTS "provider_message_id" text;
