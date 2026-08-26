-- Refresh-token rotation grace window: keep the previous token hash and the
-- rotation timestamp so concurrent refreshes (parallel tabs/requests holding
-- the just-rotated token) are honored briefly instead of being misclassified
-- as token reuse and revoking the whole session.
ALTER TABLE "auth_sessions"
  ADD COLUMN IF NOT EXISTS "previous_refresh_token_hash" text,
  ADD COLUMN IF NOT EXISTS "previous_rotated_at" timestamp with time zone;
