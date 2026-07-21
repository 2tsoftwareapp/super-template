-- D-001: stop storing plaintext access/refresh tokens in SSO exchanges.
-- D-002: encrypt PKCE code_verifier at rest (AES-GCM columns, same shape as MFA secrets).
-- In-flight SSO rows are short-lived; wipe them rather than backfilling secrets.
DELETE FROM "sso_session_exchanges";
--> statement-breakpoint
ALTER TABLE "sso_session_exchanges" DROP COLUMN "access_token";
--> statement-breakpoint
ALTER TABLE "sso_session_exchanges" DROP COLUMN "refresh_token";
--> statement-breakpoint
ALTER TABLE "sso_session_exchanges" ADD COLUMN "session_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "sso_session_exchanges" ADD CONSTRAINT "sso_session_exchanges_session_id_auth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."auth_sessions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sso_session_exchanges_session_id_idx" ON "sso_session_exchanges" USING btree ("session_id");
--> statement-breakpoint
DELETE FROM "sso_login_states";
--> statement-breakpoint
ALTER TABLE "sso_login_states" DROP COLUMN "code_verifier";
--> statement-breakpoint
ALTER TABLE "sso_login_states" ADD COLUMN "code_verifier_ciphertext" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "sso_login_states" ADD COLUMN "code_verifier_iv" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "sso_login_states" ADD COLUMN "code_verifier_auth_tag" text NOT NULL;
