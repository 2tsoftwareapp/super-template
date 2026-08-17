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

-- 2. Insert canonical assignments from dedup, skip when PK already exists
INSERT INTO user_roles (user_id, role_id, organization_id, assigned_at)
SELECT DISTINCT ur.user_id, d.keep_id, d.organization_id, MIN(ur.assigned_at)
FROM _org_role_dedup d
JOIN user_roles ur ON ur.role_id = ANY(d.delete_ids)
GROUP BY ur.user_id, d.keep_id, d.organization_id
ON CONFLICT (user_id, role_id) DO NOTHING;

--> statement-breakpoint

-- 3. Delete old assignments pointing to duplicate roles
DELETE FROM user_roles ur
USING _org_role_dedup d
WHERE ur.role_id = ANY(d.delete_ids);

--> statement-breakpoint

-- 4. Merge role_permissions into the canonical role (dedup via ON CONFLICT)
INSERT INTO role_permissions (role_id, permission_id)
SELECT d.keep_id, rp.permission_id
FROM _org_role_dedup d
JOIN role_permissions rp ON rp.role_id = ANY(d.delete_ids)
ON CONFLICT DO NOTHING;

--> statement-breakpoint

-- 5. Delete duplicate roles (user_roles and role_permissions already rewired)
DELETE FROM roles r
USING _org_role_dedup d
WHERE r.id = ANY(d.delete_ids);

--> statement-breakpoint

-- 6. Drop temp table
DROP TABLE IF EXISTS _org_role_dedup;

--> statement-breakpoint

-- 7. Add partial unique index for organization system roles
CREATE UNIQUE INDEX IF NOT EXISTS "roles_org_system_name_unique"
  ON "roles" (organization_id, LOWER(name))
  WHERE is_system = true AND organization_id IS NOT NULL;

--> statement-breakpoint

-- 8. Remove any platform permissions from org roles (C-001 defensive)
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.organization_id IS NOT NULL
  AND LOWER(SPLIT_PART(p.name, '.', 1))
      IN ('settings', 'audit', 'mail', 'jobs');
