-- L-002: Enforce user_roles.organization_id matches roles.organization_id.
-- A BEFORE trigger validates scope consistency because a composite FK would
-- require a unique constraint on roles(id, organization_id) and MATCH SIMPLE
-- would skip null-org checks anyway.
-- Existing invalid rows are cleaned up before the trigger is applied.

--> statement-breakpoint

-- Remove dangling assignments where role does not exist
DELETE FROM user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = ur.role_id);

--> statement-breakpoint

-- Remove cross-scope assignments (user_roles.org_id != roles.org_id)
DELETE FROM user_roles ur
USING roles r
WHERE ur.role_id = r.id
  AND ur.organization_id IS DISTINCT FROM r.organization_id;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION check_user_role_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  role_org_id uuid;
BEGIN
  SELECT r.organization_id INTO role_org_id
  FROM roles r
  WHERE r.id = NEW.role_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'referenced role % does not exist', NEW.role_id
      USING ERRCODE = '23503';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM role_org_id THEN
    RAISE EXCEPTION 'user_roles.organization_id must match roles.organization_id (expected %, got %)',
      role_org_id, NEW.organization_id
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_user_role_scope ON user_roles;

--> statement-breakpoint

CREATE TRIGGER trg_user_role_scope
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION check_user_role_scope();
