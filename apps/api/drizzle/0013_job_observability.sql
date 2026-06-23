CREATE TABLE "job_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"organization_id" uuid,
	"attempt_number" integer NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "job_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"organization_id" uuid,
	"attempt_id" uuid,
	"type" text NOT NULL,
	"message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"depends_on_job_id" uuid NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_attempts" ADD CONSTRAINT "job_attempts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_attempts" ADD CONSTRAINT "job_attempts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_attempt_id_job_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."job_attempts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_dependencies" ADD CONSTRAINT "job_dependencies_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_dependencies" ADD CONSTRAINT "job_dependencies_depends_on_job_id_jobs_id_fk" FOREIGN KEY ("depends_on_job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_dependencies" ADD CONSTRAINT "job_dependencies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "job_attempts_job_id_attempt_number_unique" ON "job_attempts" USING btree ("job_id","attempt_number");
--> statement-breakpoint
CREATE INDEX "job_attempts_job_id_idx" ON "job_attempts" USING btree ("job_id");
--> statement-breakpoint
CREATE INDEX "job_attempts_organization_id_idx" ON "job_attempts" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "job_events_job_id_idx" ON "job_events" USING btree ("job_id");
--> statement-breakpoint
CREATE INDEX "job_events_job_id_created_at_idx" ON "job_events" USING btree ("job_id","created_at");
--> statement-breakpoint
CREATE INDEX "job_events_organization_id_idx" ON "job_events" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "job_dependencies_job_id_depends_on_unique" ON "job_dependencies" USING btree ("job_id","depends_on_job_id");
--> statement-breakpoint
CREATE INDEX "job_dependencies_job_id_idx" ON "job_dependencies" USING btree ("job_id");
--> statement-breakpoint
CREATE INDEX "job_dependencies_depends_on_job_id_idx" ON "job_dependencies" USING btree ("depends_on_job_id");
--> statement-breakpoint
CREATE INDEX "job_dependencies_organization_id_idx" ON "job_dependencies" USING btree ("organization_id");
--> statement-breakpoint
ALTER TABLE "job_attempts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "job_attempts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "job_attempts_tenant_isolation" ON "job_attempts" AS PERMISSIVE FOR ALL TO public USING ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));
--> statement-breakpoint
ALTER TABLE "job_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "job_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "job_events_tenant_isolation" ON "job_events" AS PERMISSIVE FOR ALL TO public USING ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));
--> statement-breakpoint
ALTER TABLE "job_dependencies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "job_dependencies" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "job_dependencies_tenant_isolation" ON "job_dependencies" AS PERMISSIVE FOR ALL TO public USING ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));
