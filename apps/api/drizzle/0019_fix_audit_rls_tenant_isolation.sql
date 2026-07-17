-- The migration runner wraps the entire file in a single transaction.

--> statement-breakpoint

-- Replace the permissive RLS policy that treated NULL organization_id as
-- visible to all tenants. The old policy let any org-scoped user see
-- platform-level audit entries (login failures, SSO events, etc.) that should
-- be restricted to SUPER_ADMIN through bypass_rls.
--
-- New policy:
--   USING  → bypass_rls=true  OR  organization_id = app.tenant_id
--   CHECK  → bypass_rls=true  OR  organization_id = app.tenant_id
--
-- This means:
--   - SUPER_ADMIN (bypass_rls = true) sees everything.
--   - Org-scoped users see only rows matching their active organization.
--   - Platform-level events (organization_id IS NULL) are invisible to
--     regular tenants — they are SUPER_ADMIN-only.

DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON "audit_logs";

CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs" AS PERMISSIVE FOR ALL TO public
  USING (
    (current_setting('app.bypass_rls', true) = 'true')
    OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  )
  WITH CHECK (
    (current_setting('app.bypass_rls', true) = 'true')
    OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  );
