-- Add explicit scope column to permissions.
-- Classification uses the authoritative RESOURCE_SCOPE catalog:
--   platform: settings, audit, mail, jobs
--   organization: users, roles, notifications, files, attachments, imports, exports, activities
-- Unknown resources default to 'platform' (fail closed).

--> statement-breakpoint

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS scope text;

--> statement-breakpoint

-- 1. Known platform resources
UPDATE permissions SET scope = 'platform'
WHERE LOWER(SPLIT_PART(name, '.', 1)) IN ('settings', 'audit', 'mail', 'jobs');

--> statement-breakpoint

-- 2. Known organization resources
UPDATE permissions SET scope = 'organization'
WHERE scope IS NULL
  AND LOWER(SPLIT_PART(name, '.', 1)) IN (
    'users', 'roles', 'notifications', 'files',
    'attachments', 'imports', 'exports', 'activities'
  );

--> statement-breakpoint

-- 3. Unknown legacy permissions → platform (fail closed)
UPDATE permissions SET scope = 'platform'
WHERE scope IS NULL;

--> statement-breakpoint

-- 4. Remove platform permissions from organization roles (C-001 safe cleanup)
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.organization_id IS NOT NULL
  AND p.scope = 'platform';

--> statement-breakpoint

ALTER TABLE permissions ALTER COLUMN scope SET NOT NULL;

--> statement-breakpoint

ALTER TABLE permissions ADD CONSTRAINT permissions_scope_check
  CHECK (scope IN ('platform', 'organization'));
