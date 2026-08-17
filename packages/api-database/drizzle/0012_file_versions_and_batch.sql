ALTER TABLE "files" ADD COLUMN "checksum" text;
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "latest_version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE INDEX "files_mime_type_idx" ON "files" USING btree ("mime_type");
--> statement-breakpoint
CREATE INDEX "files_created_at_idx" ON "files" USING btree ("created_at");
--> statement-breakpoint
CREATE TABLE "file_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum" text NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_batch_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_id" uuid,
	"operation" text NOT NULL,
	"idempotency_key" text,
	"results" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "file_batch_operations" ADD CONSTRAINT "file_batch_operations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "file_batch_operations" ADD CONSTRAINT "file_batch_operations_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "file_versions_file_id_version_number_unique" ON "file_versions" USING btree ("file_id","version_number");
--> statement-breakpoint
CREATE INDEX "file_versions_file_id_idx" ON "file_versions" USING btree ("file_id");
--> statement-breakpoint
CREATE INDEX "file_versions_organization_id_idx" ON "file_versions" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "file_batch_operations_actor_idempotency_key_unique" ON "file_batch_operations" USING btree ("actor_id","idempotency_key") WHERE "idempotency_key" is not null;
--> statement-breakpoint
CREATE INDEX "file_batch_operations_organization_id_idx" ON "file_batch_operations" USING btree ("organization_id");
--> statement-breakpoint
ALTER TABLE "file_versions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "file_versions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "file_versions_tenant_isolation" ON "file_versions" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));
--> statement-breakpoint
ALTER TABLE "file_batch_operations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "file_batch_operations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "file_batch_operations_tenant_isolation" ON "file_batch_operations" AS PERMISSIVE FOR ALL TO public USING ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true')) WITH CHECK ((organization_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid) OR (current_setting('app.bypass_rls', true) = 'true'));
