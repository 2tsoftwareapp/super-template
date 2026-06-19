import type { JsonObject } from '@repo/api-core';

import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from '../shared/timestamps';
import { users } from './users';

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('system'),
  language: text('language').notNull().default('en'),
  timezone: text('timezone').notNull().default('UTC'),
  notificationPreferences: jsonb('notification_preferences')
    .$type<JsonObject>()
    .notNull()
    .default({}),
  emailPreferences: jsonb('email_preferences')
    .$type<JsonObject>()
    .notNull()
    .default({}),
  ...timestamps,
});
