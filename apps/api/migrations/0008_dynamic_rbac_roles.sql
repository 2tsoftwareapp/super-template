ALTER TABLE "roles" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
UPDATE "roles" SET "is_system" = true WHERE "name" IN ('SUPER_ADMIN', 'ADMIN', 'USER');--> statement-breakpoint
UPDATE "permissions" SET "is_system" = true;--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_name_unique";--> statement-breakpoint
INSERT INTO "roles" ("organization_id", "name", "description", "is_system")
SELECT "organizations"."id", 'ADMIN', 'Organization administrator role', true
FROM "organizations"
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT "organization_admin_roles"."id", "role_permissions"."permission_id"
FROM "roles" "platform_admin_roles"
INNER JOIN "role_permissions" ON "role_permissions"."role_id" = "platform_admin_roles"."id"
INNER JOIN "roles" "organization_admin_roles"
  ON "organization_admin_roles"."name" = 'ADMIN'
  AND "organization_admin_roles"."organization_id" IS NOT NULL
WHERE "platform_admin_roles"."name" = 'ADMIN'
  AND "platform_admin_roles"."organization_id" IS NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role_id", "organization_id")
SELECT "organization_members"."user_id", "organization_admin_roles"."id", "organization_members"."organization_id"
FROM "organization_members"
INNER JOIN "roles" "organization_admin_roles"
  ON "organization_admin_roles"."name" = 'ADMIN'
  AND "organization_admin_roles"."organization_id" = "organization_members"."organization_id"
WHERE "organization_members"."role" = 'OWNER'
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role_id", "organization_id")
SELECT DISTINCT "organization_members"."user_id", "organization_admin_roles"."id", "organization_members"."organization_id"
FROM "user_roles" "legacy_admin_assignments"
INNER JOIN "roles" "platform_admin_roles"
  ON "platform_admin_roles"."id" = "legacy_admin_assignments"."role_id"
  AND "platform_admin_roles"."name" = 'ADMIN'
  AND "platform_admin_roles"."organization_id" IS NULL
INNER JOIN "organization_members"
  ON "organization_members"."user_id" = "legacy_admin_assignments"."user_id"
INNER JOIN "roles" "organization_admin_roles"
  ON "organization_admin_roles"."name" = 'ADMIN'
  AND "organization_admin_roles"."organization_id" = "organization_members"."organization_id"
WHERE "legacy_admin_assignments"."organization_id" IS NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
DELETE FROM "role_permissions"
USING "roles"
WHERE "role_permissions"."role_id" = "roles"."id"
  AND "roles"."name" = 'ADMIN'
  AND "roles"."organization_id" IS NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_platform_name_unique" ON "roles" USING btree ("name") WHERE "roles"."organization_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_organization_name_unique" ON "roles" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "roles_organization_id_idx" ON "roles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_roles_organization_id_idx" ON "user_roles" USING btree ("organization_id");
