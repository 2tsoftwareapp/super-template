import { pgEnum } from 'drizzle-orm/pg-core';

export const mailDeliveryStatusEnum = pgEnum('mail_delivery_status', [
  'SENT',
  'FAILED',
]);

export const jobStatusEnum = pgEnum('job_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
]);

export const importExportJobStatusEnum = pgEnum('import_export_job_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);
