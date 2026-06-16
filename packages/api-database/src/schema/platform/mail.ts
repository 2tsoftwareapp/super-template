import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { mailDeliveryStatusEnum } from './enums';

export const mailDeliveries = pgTable(
  'mail_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateKey: text('template_key').notNull(),
    recipient: text('recipient').notNull(),
    subject: text('subject').notNull(),
    status: mailDeliveryStatusEnum('status').notNull(),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('mail_deliveries_template_key_idx').on(table.templateKey),
    index('mail_deliveries_created_at_idx').on(table.createdAt),
  ],
);
