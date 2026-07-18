CREATE TYPE "public"."notification_delivery_status" AS ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"device_token_id" uuid NOT NULL,
	"channel" text DEFAULT 'fcm' NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"provider_message_id" text,
	"next_attempt_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_device_token_id_notification_device_tokens_id_fk" FOREIGN KEY ("device_token_id") REFERENCES "public"."notification_device_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_deliveries_unique" ON "notification_deliveries" USING btree ("notification_id","device_token_id","channel");--> statement-breakpoint
CREATE INDEX "notification_deliveries_status_next_attempt_idx" ON "notification_deliveries" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_device_token_id_idx" ON "notification_deliveries" USING btree ("device_token_id");
