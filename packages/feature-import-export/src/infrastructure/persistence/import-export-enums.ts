import { pgEnum } from "drizzle-orm/pg-core";

export const importExportJobStatusEnum = pgEnum("import_export_job_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
