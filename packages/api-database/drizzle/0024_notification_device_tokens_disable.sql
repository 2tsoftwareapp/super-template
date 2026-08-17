ALTER TABLE "notification_device_tokens" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_device_tokens" ADD COLUMN "disabled_reason" text;
