-- Content fingerprint for import jobs (audit finding C-05).
--
-- `create-import` validates the uploaded file and `confirm-import` re-reads it
-- from object storage before importing rows. Nothing tied the two reads
-- together, so replacing the stored object between validate and confirm
-- imported content that was never validated.
--
-- The job now records the SHA-256 of the exact bytes that were validated; the
-- confirm step recomputes it and refuses (IMPORT_FILE_MODIFIED) when the digest
-- differs. The column is nullable because jobs created before this migration
-- have no fingerprint; confirm treats a missing fingerprint as unverifiable and
-- refuses as well, so the guard fails closed.

ALTER TABLE "t_import_jobs" ADD COLUMN "content_hash" text;--> statement-breakpoint
