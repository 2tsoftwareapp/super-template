-- Bootstrap the platform-scope organization row.
--
-- In `org-optional` deployments, organization-less users write tenant-scoped
-- rows under the sentinel organization id
-- (`PLATFORM_SCOPE_ORGANIZATION_ID` = '00000000-0000-0000-0000-000000000000',
-- see `@repo/api-kernel`). Those columns carry a foreign key to
-- `m_organizations`, so the sentinel row must exist for inserts to succeed.
--
-- The row is a technical placeholder, not a real tenant: it is never listed,
-- never joined, and no RLS policy grants tenant access to it (migration 0038
-- rewrites the `<base>_tenant_isolation` policies so sentinel-scoped rows are
-- user-scoped instead). Idempotent via ON CONFLICT DO NOTHING.
INSERT INTO "m_organizations" ("id", "name", "slug")
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Platform scope',
  'platform-scope'
)
ON CONFLICT DO NOTHING;
