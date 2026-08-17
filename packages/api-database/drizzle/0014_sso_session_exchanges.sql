CREATE TABLE "sso_session_exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"organization_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sso_session_exchanges_code_hash_unique" ON "sso_session_exchanges" USING btree ("code_hash");
