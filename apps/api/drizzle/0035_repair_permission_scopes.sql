-- C-001: Forward repair for databases that applied the first version of 0033
-- which incorrectly classified known organization permissions as 'platform'.
-- Unlike 0033, this migration does not assume scope is NULL — it targets
-- permissions by name prefix regardless of current scope value.

--> statement-breakpoint

-- 1. Fix known organization permissions (may have been misclassified as platform)
UPDATE permissions SET scope = 'organization'
WHERE LOWER(SPLIT_PART(name, '.', 1)) IN (
  'users', 'roles', 'notifications', 'files',
  'attachments', 'imports', 'exports', 'activities'
);

--> statement-breakpoint

-- 2. Fix known platform permissions (defensive — should already be correct)
UPDATE permissions SET scope = 'platform'
WHERE LOWER(SPLIT_PART(name, '.', 1)) IN ('settings', 'audit', 'mail', 'jobs');

--> statement-breakpoint

-- 3. Unknown permissions → platform (fail closed)
UPDATE permissions SET scope = 'platform'
WHERE scope IS NULL;

--> statement-breakpoint

-- 4. Remove any remaining platform permission grants on organization roles
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.organization_id IS NOT NULL
  AND p.scope = 'platform';

--> statement-breakpoint

-- 5. Guard: fail if any organization role still has a platform permission
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
