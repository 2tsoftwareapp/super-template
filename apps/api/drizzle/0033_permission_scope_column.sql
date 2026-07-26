-- M-001: Add explicit scope column to permissions.
-- The scope ('platform' | 'organization') is the source of truth for
-- permission classification. Backfill all existing permissions.
-- Unknown/unclassified permissions default to 'platform' (fail-closed).

--> statement-breakpoint

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS scope text;

--> statement-breakpoint

UPDATE permissions SET scope = 'platform'
WHERE LOWER(SPLIT_PART(name, '.', 1)) IN ('settings', 'audit', 'mail', 'jobs');

--> statement-breakpoint

UPDATE permissions SET scope = 'organization'
WHERE scope IS NULL;
