-- Organization-optional model: user-scoped rows must stay invisible to other
-- sessions even though their `organization_id` does not match any real tenant.
--
-- Strategy: every tenant-isolation policy gains an OR-branch
--   organization_id = '00000000-0000-0000-0000-000000000000'::uuid
--     AND app.user_id = <owner uuid column>
-- so platform-scope (sentinel) rows are only readable/writable by their owner
-- (or by an explicit `app.bypass_rls` session, e.g. worker dispatch).
-- Real organization rows keep their exact previous predicate, so deployments
-- using the personal-orgs model are unaffected.

CREATE OR REPLACE FUNCTION app_tenant_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_user_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_bypass_rls() RETURNS boolean AS $$
  SELECT COALESCE(current_setting('app.bypass_rls', true), '') = 'true';
$$ LANGUAGE sql STABLE;

-- policy (re)definitions; each DROP+CREATE is idempotent.
DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON "l_audit_logs";--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_isolation" ON "l_audit_logs" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND actor_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND actor_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "activities_tenant_isolation" ON "l_activities";--> statement-breakpoint
CREATE POLICY "activities_tenant_isolation" ON "l_activities" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND actor_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND actor_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "files_tenant_isolation" ON "m_files";--> statement-breakpoint
CREATE POLICY "files_tenant_isolation" ON "m_files" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND uploaded_by_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND uploaded_by_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "file_versions_tenant_isolation" ON "t_file_versions";--> statement-breakpoint
CREATE POLICY "file_versions_tenant_isolation" ON "t_file_versions" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "file_batch_operations_tenant_isolation" ON "t_file_batch_operations";--> statement-breakpoint
CREATE POLICY "file_batch_operations_tenant_isolation" ON "t_file_batch_operations" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND actor_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND actor_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "attachments_tenant_isolation" ON "r_attachments";--> statement-breakpoint
CREATE POLICY "attachments_tenant_isolation" ON "r_attachments" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "jobs_tenant_isolation" ON "w_jobs";--> statement-breakpoint
CREATE POLICY "jobs_tenant_isolation" ON "w_jobs" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "job_attempts_tenant_isolation" ON "w_job_attempts";--> statement-breakpoint
CREATE POLICY "job_attempts_tenant_isolation" ON "w_job_attempts" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND organization_id IS NOT NULL)
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND organization_id IS NOT NULL)
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "job_events_tenant_isolation" ON "w_job_events";--> statement-breakpoint
CREATE POLICY "job_events_tenant_isolation" ON "w_job_events" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND organization_id IS NOT NULL)
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND organization_id IS NOT NULL)
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "job_dependencies_tenant_isolation" ON "r_job_dependencies";--> statement-breakpoint
CREATE POLICY "job_dependencies_tenant_isolation" ON "r_job_dependencies" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND organization_id IS NOT NULL)
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND organization_id IS NOT NULL)
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "import_jobs_tenant_isolation" ON "t_import_jobs";--> statement-breakpoint
CREATE POLICY "import_jobs_tenant_isolation" ON "t_import_jobs" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "export_jobs_tenant_isolation" ON "t_export_jobs";--> statement-breakpoint
CREATE POLICY "export_jobs_tenant_isolation" ON "t_export_jobs" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND created_by_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "notifications_tenant_isolation" ON "t_notifications";--> statement-breakpoint
CREATE POLICY "notifications_tenant_isolation" ON "t_notifications" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND user_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND user_id = app_user_id())
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "notification_jobs_tenant_isolation" ON "w_notification_jobs";--> statement-breakpoint
CREATE POLICY "notification_jobs_tenant_isolation" ON "w_notification_jobs" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND actor_id = app_user_id())
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (organization_id = '00000000-0000-0000-0000-000000000000'::uuid AND actor_id = app_user_id())
    OR app_bypass_rls()
  );
