-- Tenant isolation for the mail delivery log (audit finding A-01).
--
-- `t_mail_deliveries` stored recipient, subject and delivery metadata with no
-- tenant column and no policy, so delivery rows were cross-tenant at the
-- database level. This migration adds the tenant column (`m_organizations` FK,
-- ON DELETE cascade — a deleted tenant's log never degrades into an owner-less
-- platform row) and fences the table with the standard
-- `<base>_tenant_isolation` policy used by every other tenant-scoped table.
--
-- Nullable handling: `organization_id IS NULL` is kept as an explicit branch
-- because (a) rows written before this migration have no tenant, and (b) the
-- auth mail flows (verify-email, reset-password, welcome) are dispatched by the
-- outbox worker, which has no tenant context to attribute them to. Those rows
-- are platform scope and are never attributed to a tenant. Keeping the branch is
-- what lets that system flow claim and finalise its own rows; the shape matches
-- `w_jobs` and `w_notification_jobs`. The tenant-facing read path
-- (`MailDeliveriesRepository.list()`, `GET /admin/mail/deliveries`) filters on
-- the caller's organization, so platform-scope rows are never surfaced to a
-- tenant session.

ALTER TABLE "t_mail_deliveries" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "t_mail_deliveries" ADD CONSTRAINT "t_mail_deliveries_organization_id_m_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."m_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_deliveries_organization_id_idx" ON "t_mail_deliveries" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "t_mail_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "t_mail_deliveries" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "mail_deliveries_tenant_isolation" ON "t_mail_deliveries";--> statement-breakpoint
CREATE POLICY "mail_deliveries_tenant_isolation" ON "t_mail_deliveries" AS PERMISSIVE FOR ALL TO public
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
