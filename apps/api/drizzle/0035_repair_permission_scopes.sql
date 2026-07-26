-- C-001: Forward repair for databases that applied the first version of 0033
-- which incorrectly classified known organization permissions as 'platform'.
-- This migration treats the organization resource catalog as the allow-list;
-- every other legacy permission is platform-scoped (fail closed).

--> statement-breakpoint

-- 1. Restore the authoritative organization-scoped resources.
UPDATE permissions SET scope = 'organization'
WHERE LOWER(SPLIT_PART(name, '.', 1)) IN (
  'users', 'roles', 'notifications', 'files',
  'attachments', 'imports', 'exports', 'activities'
);

--> statement-breakpoint

-- 2. Everything outside the organization allow-list is platform-scoped.
-- This also repairs unknown permissions that were previously persisted with
-- scope = 'organization', not only rows whose scope is NULL.
UPDATE permissions SET scope = 'platform'
WHERE LOWER(SPLIT_PART(name, '.', 1)) NOT IN (
  'users', 'roles', 'notifications', 'files',
  'attachments', 'imports', 'exports', 'activities'
);

--> statement-breakpoint

-- 3. Remove platform permission grants from organization roles after the
-- authoritative scope repair above.
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.organization_id IS NOT NULL
  AND p.scope = 'platform';

--> statement-breakpoint

-- 4. Guard: fail if any organization role still has a platform permission.
DO $$
DECLARE
  remaining bigint;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE r.organization_id IS NOT NULL AND p.scope = 'platform';

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Guard failed: % organization roles still have platform permissions after repair', remaining;
  END IF;
END;
$$;
