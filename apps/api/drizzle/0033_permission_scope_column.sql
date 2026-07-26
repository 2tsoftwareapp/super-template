-- M-001: Add explicit scope column to permissions.
-- The scope ('platform' | 'organization') is the source of truth for
-- permission classification. After backfilling, the column is made NOT NULL
-- with a CHECK constraint to prevent unclassified permissions.

--> statement-breakpoint

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS scope text;

--> statement-breakpoint

UPDATE permissions SET scope = 'platform'
WHERE LOWER(SPLIT_PART(name, '.', 1)) IN ('settings', 'audit', 'mail', 'jobs');

--> statement-breakpoint

UPDATE permissions SET scope = 'organization'
WHERE scope IS NULL;

--> statement-breakpoint

ALTER TABLE permissions ALTER COLUMN scope SET NOT NULL;

--> statement-breakpoint

ALTER TABLE permissions ADD CONSTRAINT permissions_scope_check
  CHECK (scope IN ('platform', 'organization'));
