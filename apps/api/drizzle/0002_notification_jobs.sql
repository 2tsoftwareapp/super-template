CREATE TYPE "public"."notification_audience" AS ENUM('USER', 'USERS', 'ALL');--> statement-breakpoint
CREATE TYPE "public"."notification_job_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED');--> statement-breakpoint
CREATE TABLE "notification_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"audience" "notification_audience" NOT NULL,
	"target_user_id" uuid,
	"user_ids" jsonb,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "notification_job_status" DEFAULT 'PENDING' NOT NULL,
	"recipient_count" integer,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_jobs_status_scheduled_at_idx" ON "notification_jobs" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "notification_jobs_actor_id_idx" ON "notification_jobs" USING btree ("actor_id");
