-- H-001: Deduplicate organization system roles and add partial unique index.
-- Uses a temporary table to materialize the dedup mapping across statements
-- (PostgreSQL CTEs are scoped to a single statement).

--> statement-breakpoint

-- 1. Materialize dedup mapping into a temp table so it survives statement boundaries
CREATE TEMP TABLE _org_role_dedup AS
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
)
SELECT
  normalized_name,
  organization_id,
  role_ids[1] AS keep_id,
  role_ids[2:array_length(role_ids, 1)] AS delete_ids
FROM dupes;

--> statement-breakpoint

-- 2. Rewire user_roles to the canonical role; skip if already present
UPDATE user_roles ur
SET role_id = d.keep_id
FROM _org_role_dedup d
WHERE ur.role_id = ANY(d.delete_ids)
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = ur.user_id
      AND ur2.role_id = d.keep_id
  );

--> statement-breakpoint

-- 3. Merge role_permissions into the canonical role (dedup via ON CONFLICT)
INSERT INTO role_permissions (role_id, permission_id)
SELECT d.keep_id, rp.permission_id
FROM _org_role_dedup d
JOIN role_permissions rp ON rp.role_id = ANY(d.delete_ids)
ON CONFLICT DO NOTHING;

--> statement-breakpoint

-- 4. Delete duplicate roles (user_roles and role_permissions already rewired)
DELETE FROM roles r
USING _org_role_dedup d
WHERE r.id = ANY(d.delete_ids);

--> statement-breakpoint

-- 5. Drop temp table
DROP TABLE IF EXISTS _org_role_dedup;

--> statement-breakpoint

-- 6. Add partial unique index for organization system roles
CREATE UNIQUE INDEX IF NOT EXISTS "roles_org_system_name_unique"
  ON "roles" (organization_id, LOWER(name))
  WHERE is_system = true AND organization_id IS NOT NULL;

--> statement-breakpoint

-- 7. C-001 defensive: remove any platform permissions from org roles
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.organization_id IS NOT NULL
  AND LOWER(SPLIT_PART(p.name, '.', 1))
      IN ('settings', 'audit', 'mail', 'jobs');
