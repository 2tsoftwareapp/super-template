import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../shared/timestamps';
import { users } from '../identity/users';

export const applicationSettings = pgTable('application_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedById: uuid('updated_by_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
});
