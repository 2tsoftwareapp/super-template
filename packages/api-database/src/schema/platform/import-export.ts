import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { organizations } from '../identity/organizations';
import { users } from '../identity/users';
import { timestamps } from '../shared/timestamps';
import { importExportJobStatusEnum } from './enums';
import { files } from './files';

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    type: text('type').notNull(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
    status: importExportJobStatusEnum('status').notNull().default('PENDING'),
    rowCount: integer('row_count'),
    successCount: integer('success_count'),
    errorCount: integer('error_count'),
    errors: jsonb('errors').$type<Record<string, unknown>[] | null>(),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    idempotencyKey: text('idempotency_key'),
    ...timestamps,
  },
  (table) => [
    index('import_jobs_status_idx').on(table.status),
    index('import_jobs_created_by_id_idx').on(table.createdById),
    uniqueIndex('import_jobs_created_by_idempotency_key_unique')
      .on(table.createdById, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const exportJobs = pgTable(
  'export_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    type: text('type').notNull(),
    status: importExportJobStatusEnum('status').notNull().default('PENDING'),
    fileId: uuid('file_id').references(() => files.id, {
      onDelete: 'set null',
    }),
    filters: jsonb('filters').$type<Record<string, unknown> | null>(),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    idempotencyKey: text('idempotency_key'),
    ...timestamps,
  },
  (table) => [
    index('export_jobs_status_idx').on(table.status),
    index('export_jobs_created_by_id_idx').on(table.createdById),
    uniqueIndex('export_jobs_created_by_idempotency_key_unique')
      .on(table.createdById, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);
