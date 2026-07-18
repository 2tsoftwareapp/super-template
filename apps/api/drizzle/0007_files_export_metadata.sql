-- Custom SQL migration file, put your code below! --
ALTER TABLE "files" ALTER COLUMN "organization_id" DROP NOT NULL;
ALTER TABLE "files" ADD COLUMN "kind" text DEFAULT 'GENERIC' NOT NULL;
ALTER TABLE "files" ADD COLUMN "visibility" text DEFAULT 'TENANT' NOT NULL;