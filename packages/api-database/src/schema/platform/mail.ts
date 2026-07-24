import type { JsonObject } from '@repo/api-core';

import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { mailDeliveryStatusEnum } from './enums';
import { jobs } from './jobs';

export const mailDeliveries = pgTable(
  'mail_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateKey: text('template_key').notNull(),
    recipient: text('recipient').notNull(),
    subject: text('subject').notNull(),
    status: mailDeliveryStatusEnum('status').notNull(),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata').$type<JsonObject | null>(),
    sourceJobId: uuid('source_job_id').references(() => jobs.id, {
      onDelete: 'set null',
    }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('mail_deliveries_job_recipient_uniq').on(table.sourceJobId, table.recipient),
    index('mail_deliveries_template_key_idx').on(table.templateKey),
    index('mail_deliveries_created_at_idx').on(table.createdAt),
    index('mail_deliveries_source_job_id_idx').on(table.sourceJobId),
  ],
);
