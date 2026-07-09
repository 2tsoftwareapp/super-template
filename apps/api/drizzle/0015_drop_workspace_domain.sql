-- Drop workspace domain tables (projects, comments, invitations).
-- Notifications and activities remain as platform cross-cutting concerns.

DROP TABLE IF EXISTS "comments" CASCADE;
DROP TABLE IF EXISTS "invitations" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;

DROP TYPE IF EXISTS "project_status";
DROP TYPE IF EXISTS "invitation_status";
