import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../shared/timestamps';
import { organizations } from '../identity/organizations';
import { users } from '../identity/users';
import { files } from './files';

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    label: text('label'),
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('attachments_entity_idx').on(table.entityType, table.entityId),
    index('attachments_file_id_idx').on(table.fileId),
  ],
);
