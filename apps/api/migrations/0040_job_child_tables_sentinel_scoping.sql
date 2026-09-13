-- Scope platform-sentinel rows in the job-observability child tables by owner.
--
-- Migration 0038 rewrote the `<base>_tenant_isolation` policies so that
-- sentinel-scoped rows (organization_id = '0000…0000') are user-scoped via an
-- owner column. For `w_job_attempts`, `w_job_events`, and `r_job_dependencies`
-- the sentinel branch was mistakenly written as
-- `organization_id = sentinel AND organization_id IS NOT NULL`, a tautology
-- that left those rows readable and writable by every authenticated session.
--
-- These child tables carry no owner column of their own; ownership is derived
-- from the parent `w_jobs.created_by_id`. This migration replaces the
-- tautological branch with an EXISTS check against the parent job's creator.
-- Rows whose parent job has no creator (worker-internal enqueues, which
-- normally carry organization_id IS NULL anyway) stay on the pre-existing
-- `organization_id IS NULL` branch.

DROP POLICY IF EXISTS "job_attempts_tenant_isolation" ON "w_job_attempts";--> statement-breakpoint
CREATE POLICY "job_attempts_tenant_isolation" ON "w_job_attempts" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (
      organization_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND EXISTS (
        SELECT 1 FROM "w_jobs" j
        WHERE j."id" = "w_job_attempts"."job_id" AND j."created_by_id" = app_user_id()
      )
    )
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (
      organization_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND EXISTS (
        SELECT 1 FROM "w_jobs" j
        WHERE j."id" = "w_job_attempts"."job_id" AND j."created_by_id" = app_user_id()
      )
    )
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "job_events_tenant_isolation" ON "w_job_events";--> statement-breakpoint
CREATE POLICY "job_events_tenant_isolation" ON "w_job_events" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (
      organization_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND EXISTS (
        SELECT 1 FROM "w_jobs" j
        WHERE j."id" = "w_job_events"."job_id" AND j."created_by_id" = app_user_id()
      )
    )
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (
      organization_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND EXISTS (
        SELECT 1 FROM "w_jobs" j
        WHERE j."id" = "w_job_events"."job_id" AND j."created_by_id" = app_user_id()
      )
    )
    OR app_bypass_rls()
  );--> statement-breakpoint

DROP POLICY IF EXISTS "job_dependencies_tenant_isolation" ON "r_job_dependencies";--> statement-breakpoint
CREATE POLICY "job_dependencies_tenant_isolation" ON "r_job_dependencies" AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (
      organization_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND EXISTS (
        SELECT 1 FROM "w_jobs" j
        WHERE j."id" = "r_job_dependencies"."job_id" AND j."created_by_id" = app_user_id()
      )
    )
    OR app_bypass_rls()
  )
  WITH CHECK (
    organization_id IS NULL
    OR organization_id = app_tenant_id()
    OR (
      organization_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND EXISTS (
        SELECT 1 FROM "w_jobs" j
        WHERE j."id" = "r_job_dependencies"."job_id" AND j."created_by_id" = app_user_id()
      )
    )
    OR app_bypass_rls()
  );
