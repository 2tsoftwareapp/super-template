-- Tenant isolation for the transactional outbox (audit finding A-04).
--
-- `w_outbox_messages` carried business payloads (user ids, emails, tokens) with
-- no tenant column and no policy, so every session could read and claim every
-- tenant's events. The table now records the publishing tenant and is fenced by
-- the standard `<base>_tenant_isolation` policy.
--
-- Nullable handling: producers that run before a tenant exists (registration,
-- seed) and rows written before this migration keep `organization_id IS NULL`.
-- Those events are platform scope; the explicit `organization_id IS NULL` branch
-- is what lets the dispatcher claim and deliver them, and it matches the shape
-- already used by `w_jobs` / `w_notification_jobs` for queue tables.
-- `OutboxDispatcher` runs the cross-tenant sweep (claim, stale recovery, status
-- writes) under `WORKER_DISPATCH_CONTEXT` (`app.bypass_rls` = true) and then
-- re-enters each message's own tenant context before invoking its handler, so
-- handler writes are attributed and fenced to the publishing tenant instead of
-- the shared worker connection.

ALTER TABLE "w_outbox_messages" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
CREATE INDEX "outbox_messages_organization_id_idx" ON "w_outbox_messages" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "w_outbox_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "w_outbox_messages" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "outbox_messages_tenant_isolation" ON "w_outbox_messages";--> statement-breakpoint
CREATE POLICY "outbox_messages_tenant_isolation" ON "w_outbox_messages" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR app_bypass_rls()
  );
