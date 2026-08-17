CREATE TYPE "public"."notification_device_platform" AS ENUM('IOS', 'ANDROID');--> statement-breakpoint
CREATE TABLE "notification_device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" "notification_device_platform" NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_device_tokens" ADD CONSTRAINT "notification_device_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_device_tokens_token_unique" ON "notification_device_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "notification_device_tokens_user_id_idx" ON "notification_device_tokens" USING btree ("user_id");
