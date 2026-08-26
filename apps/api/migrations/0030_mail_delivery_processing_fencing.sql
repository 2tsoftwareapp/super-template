-- R7-H-001: Add PENDING/PROCESSING states to mail_delivery_status for proper delivery state machine
--> statement-breakpoint
ALTER TYPE mail_delivery_status ADD VALUE IF NOT EXISTS 'PENDING';
--> statement-breakpoint
ALTER TYPE mail_delivery_status ADD VALUE IF NOT EXISTS 'PROCESSING';
--> statement-breakpoint
-- Add lease_expires_at for worker fencing (claim timeout)
ALTER TABLE "mail_deliveries" ADD COLUMN IF NOT EXISTS "lease_expires_at" timestamp with time zone;
--> statement-breakpoint
-- Add updated_at for optimistic concurrency tracking
ALTER TABLE "mail_deliveries" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();
--> statement-breakpoint
-- Add claim_token for stale-worker fencing (R8-H-001)
ALTER TABLE "mail_deliveries" ADD COLUMN IF NOT EXISTS "claim_token" text;
