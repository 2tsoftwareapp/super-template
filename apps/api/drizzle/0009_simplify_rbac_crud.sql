-- Simplify RBAC to fixed roles and CRUD permissions

INSERT INTO "permissions" ("name", "description", "is_system")
VALUES
  ('roles.update', 'roles.update', true),
  ('files.create', 'files.create', true),
  ('files.update', 'files.update', true),
  ('attachments.read', 'attachments.read', true),
  ('attachments.create', 'attachments.create', true),
  ('attachments.update', 'attachments.update', true),
  ('attachments.delete', 'attachments.delete', true),
  ('settings.update', 'settings.update', true),
  ('jobs.update', 'jobs.update', true),
  ('jobs.delete', 'jobs.delete', true),
  ('invitations.update', 'invitations.update', true),
  ('invitations.delete', 'invitations.delete', true),
  ('imports.read', 'imports.read', true),
  ('imports.create', 'imports.create', true),
  ('imports.update', 'imports.update', true),
  ('exports.read', 'exports.read', true),
  ('exports.create', 'exports.create', true),
  ('comments.update', 'comments.update', true),
  ('comments.delete', 'comments.delete', true),
  ('notifications.create', 'notifications.create', true),
  ('notifications.delete', 'notifications.delete', true)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT DISTINCT rp.role_id, new_p.id
FROM "role_permissions" rp
INNER JOIN "permissions" old_p ON old_p.id = rp.permission_id
INNER JOIN "permissions" new_p ON (
  (old_p.name = 'roles.manage' AND new_p.name = 'roles.update')
  OR (old_p.name = 'files.upload' AND new_p.name = 'files.create')
  OR (old_p.name = 'settings.manage' AND new_p.name = 'settings.update')
  OR (old_p.name = 'notifications.send' AND new_p.name = 'notifications.create')
  OR (old_p.name = 'projects.invite' AND new_p.name = 'invitations.create')
)
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT DISTINCT rp.role_id, new_p.id
FROM "role_permissions" rp
INNER JOIN "permissions" old_p ON old_p.id = rp.permission_id
INNER JOIN "permissions" new_p ON new_p.name IN (
  'attachments.read',
  'attachments.create',
  'attachments.update',
  'attachments.delete'
)
WHERE old_p.name = 'attachments.manage'
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT DISTINCT rp.role_id, new_p.id
FROM "role_permissions" rp
INNER JOIN "permissions" old_p ON old_p.id = rp.permission_id
INNER JOIN "permissions" new_p ON new_p.name IN ('jobs.update', 'jobs.delete')
WHERE old_p.name = 'jobs.manage'
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT DISTINCT rp.role_id, new_p.id
FROM "role_permissions" rp
INNER JOIN "permissions" old_p ON old_p.id = rp.permission_id
INNER JOIN "permissions" new_p ON new_p.name IN (
  'imports.read',
  'imports.create',
  'imports.update'
)
WHERE old_p.name = 'imports.manage'
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT DISTINCT rp.role_id, new_p.id
FROM "role_permissions" rp
INNER JOIN "permissions" old_p ON old_p.id = rp.permission_id
INNER JOIN "permissions" new_p ON new_p.name IN ('exports.read', 'exports.create')
WHERE old_p.name = 'exports.manage'
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT DISTINCT rp.role_id, new_p.id
FROM "role_permissions" rp
INNER JOIN "permissions" old_p ON old_p.id = rp.permission_id
INNER JOIN "permissions" new_p ON new_p.name IN ('comments.update', 'comments.delete')
WHERE old_p.name = 'comments.moderate'
ON CONFLICT DO NOTHING;

DELETE FROM "role_permissions"
USING "permissions"
WHERE "role_permissions"."permission_id" = "permissions"."id"
  AND "permissions"."name" IN (
    'roles.manage',
    'files.upload',
    'attachments.manage',
    'settings.manage',
    'jobs.manage',
    'imports.manage',
    'exports.manage',
    'comments.moderate',
    'notifications.send',
    'projects.invite'
  );

DELETE FROM "permissions"
WHERE "name" IN (
  'roles.manage',
  'files.upload',
  'attachments.manage',
  'settings.manage',
  'jobs.manage',
  'imports.manage',
  'exports.manage',
  'comments.moderate',
  'notifications.send',
  'projects.invite'
);

DELETE FROM "user_roles"
USING "roles"
WHERE "user_roles"."role_id" = "roles"."id"
  AND "roles"."is_system" = false;

DELETE FROM "role_permissions"
USING "roles"
WHERE "role_permissions"."role_id" = "roles"."id"
  AND "roles"."is_system" = false;

DELETE FROM "roles"
WHERE "is_system" = false;

UPDATE "permissions" SET "is_system" = true;
