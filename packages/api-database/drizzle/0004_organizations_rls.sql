CREATE TYPE "public"."organization_member_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_active_unique" ON "organizations" USING btree ("slug") WHERE "organizations"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "organization_member_role" DEFAULT 'MEMBER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_org_user_unique" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_organization_id_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_organization_id_idx" ON "notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "files_organization_id_idx" ON "files" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "projects_tenant_isolation" ON "projects" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "files" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "files_tenant_isolation" ON "files" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "notifications_tenant_isolation" ON "notifications" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs" AS PERMISSIVE FOR ALL TO public USING ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id IS NULL) OR (organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));
