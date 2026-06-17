CREATE INDEX "notification_jobs_organization_id_idx" ON "notification_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "attachments_organization_id_idx" ON "attachments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "jobs_organization_id_idx" ON "jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitations_organization_id_idx" ON "invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "import_jobs_organization_id_idx" ON "import_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "export_jobs_organization_id_idx" ON "export_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "comments_organization_id_idx" ON "comments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "activities_organization_id_idx" ON "activities" USING btree ("organization_id");--> statement-breakpoint

ALTER TABLE "notification_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_jobs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "notification_jobs_tenant_isolation" ON "notification_jobs" AS PERMISSIVE FOR ALL TO public USING ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint

ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attachments" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "attachments_tenant_isolation" ON "attachments" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint

ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "jobs_tenant_isolation" ON "jobs" AS PERMISSIVE FOR ALL TO public USING ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint

ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "invitations_tenant_isolation" ON "invitations" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint

ALTER TABLE "import_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "import_jobs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "import_jobs_tenant_isolation" ON "import_jobs" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint

ALTER TABLE "export_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "export_jobs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "export_jobs_tenant_isolation" ON "export_jobs" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint

ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comments" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "comments_tenant_isolation" ON "comments" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint

ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "activities_tenant_isolation" ON "activities" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint
