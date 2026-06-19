import type { JsonObject } from '@repo/api-core';

import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { organizations } from '../identity/organizations';
import { users } from '../identity/users';
import { timestamps } from '../shared/timestamps';
import { jobStatusEnum } from './enums';

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    type: text('type').notNull(),
    payload: jsonb('payload').$type<JsonObject>().notNull(),
    status: jobStatusEnum('status').notNull().default('PENDING'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    priority: integer('priority').notNull().default(0),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    idempotencyKey: text('idempotency_key'),
    ...timestamps,
  },
  (table) => [
    index('jobs_status_scheduled_at_idx').on(table.status, table.scheduledAt),
    index('jobs_type_idx').on(table.type),
    uniqueIndex('jobs_created_by_idempotency_key_unique')
      .on(table.createdById, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);
