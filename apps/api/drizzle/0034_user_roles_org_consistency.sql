-- L-002: Enforce user_roles.organization_id matches roles.organization_id.
-- Composite FK ensures org-scoped assignments have a matching org-scoped role.
-- When organization_id is NULL (platform role), MATCH SIMPLE skips the check.
-- Existing invalid rows are deleted before the constraint is added.

--> statement-breakpoint

-- Remove any dangling assignments where role does not exist
DELETE FROM user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = ur.role_id);

--> statement-breakpoint

-- Remove cross-scope assignments (user_roles.org_id != roles.org_id)
DELETE FROM user_roles ur
USING roles r
WHERE ur.role_id = r.id
  AND ur.organization_id IS DISTINCT FROM r.organization_id;

--> statement-breakpoint

-- Drop old single-column FK first
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;

--> statement-breakpoint

-- Add composite FK on (role_id, organization_id) referencing roles(id, organization_id)
ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_role_org_fkey
  FOREIGN KEY (role_id, organization_id)
  REFERENCES roles (id, organization_id)
  ON DELETE CASCADE;
