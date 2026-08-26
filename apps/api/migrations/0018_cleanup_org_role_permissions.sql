-- The migration runner wraps the entire file in a single transaction
-- (BEGIN/COMMIT). Dropping the index first is safe: if any later step fails
-- the transaction rolls back and the old index is restored.

--> statement-breakpoint

-- 1. Drop the old case-sensitive unique index so name normalization below
--    does not throw duplicate-key violations.

DROP INDEX IF EXISTS "roles_organization_name_unique";

--> statement-breakpoint

-- 2. Remove platform-scoped permissions from all existing org-scoped roles.
--    New roles are already protected by application-layer rules.

DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.organization_id IS NOT NULL
  AND LOWER(SPLIT_PART(p.name, '.', 1))
      IN ('settings', 'audit', 'mail', 'jobs');

--> statement-breakpoint

-- 3. Normalize custom role names (trim + uppercase) and resolve all
--    conflicts in a single deterministic CTE:
--
--      a) Duplicate custom names        → keep earliest, suffix rest
--      b) Names matching system roles
--         (SUPER_ADMIN, ADMIN, USER)    → rename to CUSTOM_ROLE_<uuid_prefix>
--      c) Names matching system roles
--         in the same organization      → rename to CUSTOM_ROLE_<uuid_prefix>
--      d) Whitespace-only / too short   → rename to CUSTOM_ROLE_<uuid_prefix>

WITH normalized AS (
  SELECT
    id,
    organization_id,
    UPPER(TRIM(name)) AS canonical_name,
    created_at,
    EXISTS (
      SELECT 1 FROM roles system_role
      WHERE system_role.is_system = true
        AND system_role.organization_id
            IS NOT DISTINCT FROM roles.organization_id
        AND UPPER(system_role.name) = UPPER(TRIM(roles.name))
    ) AS conflicts_with_system
  FROM roles
  WHERE is_system = false
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY organization_id, canonical_name
      ORDER BY created_at, id
    ) AS duplicate_number
  FROM normalized
)
UPDATE roles r
SET name = CASE
  WHEN ranked.canonical_name IN ('SUPER_ADMIN', 'ADMIN', 'USER')
    OR ranked.conflicts_with_system
    OR LENGTH(ranked.canonical_name) < 2
  THEN 'CUSTOM_ROLE_' || LEFT(r.id::text, 8)
  WHEN ranked.duplicate_number = 1
    THEN ranked.canonical_name
  ELSE ranked.canonical_name || '_' || LEFT(r.id::text, 8)
END
FROM ranked
WHERE ranked.id = r.id;


--> statement-breakpoint

-- 4. Add a case-insensitive unique index on (organization_id, LOWER(name)).
--    The WHERE clause restricts to custom roles (is_system = false);
--    platform-level system roles are covered by roles_platform_name_unique.

CREATE UNIQUE INDEX "roles_organization_name_lower_unique"
  ON "roles" (organization_id, LOWER(name))
  WHERE is_system = false;
