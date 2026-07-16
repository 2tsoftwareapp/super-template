-- Cleanup: remove platform-scoped permissions from all existing org-scoped roles.
-- These permissions (settings, audit, mail, jobs) should only exist on platform-level
-- roles (organization_id IS NULL). The application layer now enforces this rule for
-- new roles; this migration remediates legacy data.

DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.organization_id IS NOT NULL
  AND LOWER(SPLIT_PART(p.name, '.', 1))
      IN ('settings', 'audit', 'mail', 'jobs');

--> statement-breakpoint

-- Normalize existing custom role names: trim whitespace and uppercase.
-- This brings legacy names in line with the normalizeRoleName() function in
-- RoleManagementUseCase.

UPDATE roles
SET name = UPPER(TRIM(name))
WHERE is_system = false
  AND (name != UPPER(TRIM(name)));

--> statement-breakpoint

-- Resolve case-insensitive conflicts after normalization: when two custom roles
-- in the same organization normalize to the same name, keep the oldest (by PK)
-- and suffix duplicates.

UPDATE roles r
SET name = r.name || '_' || SUBSTRING(r.id::text, 1, 8)
WHERE is_system = false
  AND EXISTS (
    SELECT 1 FROM roles r2
    WHERE r2.id != r.id
      AND r2.organization_id IS NOT DISTINCT FROM r.organization_id
      AND LOWER(r2.name) = LOWER(r.name)
      AND r2.is_system = false
      AND r2.id < r.id
  );

--> statement-breakpoint

-- Drop the old case-sensitive unique index on (organization_id, name).

DROP INDEX IF EXISTS "roles_organization_name_unique";

--> statement-breakpoint

-- Add a case-insensitive unique index on (organization_id, LOWER(name)).
-- The WHERE clause ensures custom roles (is_system = false) are covered;
-- platform system roles use roles_platform_name_unique instead.

CREATE UNIQUE INDEX "roles_organization_name_lower_unique"
  ON "roles" (organization_id, LOWER(name))
  WHERE is_system = false;
