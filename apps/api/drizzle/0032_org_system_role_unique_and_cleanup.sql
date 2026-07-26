-- H-001: Deduplicate organization system roles and add partial unique index.
-- Two concurrent ensureOrganizationAdminRole() calls could create duplicate
-- ADMIN roles in the same org. This migration:
--   1) Merges duplicates → canonical (oldest by created_at)
--   2) Rewires user_roles + role_permissions
--   3) Adds a unique index to prevent future races
--   4) Defensively re-runs platform-permission cleanup from 0018 (C-001)

--> statement-breakpoint

-- 1. Detect duplicate org system roles (same org, same name, is_system = true)
WITH dupes AS (
  SELECT
    LOWER(name) AS normalized_name,
    organization_id,
    array_agg(id ORDER BY created_at NULLS LAST, id) AS role_ids
  FROM roles
  WHERE is_system = true
    AND organization_id IS NOT NULL
  GROUP BY LOWER(name), organization_id
  HAVING COUNT(*) > 1
),
canonical AS (
  SELECT
    normalized_name,
    organization_id,
    role_ids[1] AS keep_id,
    role_ids[2:array_length(role_ids, 1)] AS delete_ids
  FROM dupes
)
-- 2. Rewire user_roles: point to canonical role; skip if already present
UPDATE user_roles ur
SET role_id = c.keep_id
FROM canonical c
WHERE ur.role_id = ANY(c.delete_ids)
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = ur.user_id
      AND ur2.role_id = c.keep_id
  );

--> statement-breakpoint

-- 3. Merge role_permissions into canonical role (dedup via ON CONFLICT DO NOTHING)
INSERT INTO role_permissions (role_id, permission_id)
SELECT c.keep_id, rp.permission_id
FROM canonical c
JOIN role_permissions rp ON rp.role_id = ANY(c.delete_ids)
ON CONFLICT DO NOTHING;

--> statement-breakpoint

-- 4. Delete duplicate rows (cascading deletes from user_roles and
--    role_permissions are already handled above)
DELETE FROM roles r
USING canonical c
WHERE r.id = ANY(c.delete_ids);

--> statement-breakpoint

-- 5. Add partial unique index for organization system roles
CREATE UNIQUE INDEX IF NOT EXISTS "roles_org_system_name_unique"
  ON "roles" (organization_id, LOWER(name))
  WHERE is_system = true AND organization_id IS NOT NULL;

--> statement-breakpoint

-- 6. C-001 defensive: re-run platform-permission cleanup from 0018.
--    Seed re-runs are now safe (they use explicit platform-scope lookup),
--    but existing org rows that may have slipped through are repaired here.
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.organization_id IS NOT NULL
  AND LOWER(SPLIT_PART(p.name, '.', 1))
      IN ('settings', 'audit', 'mail', 'jobs');
