import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../shared/timestamps';
import { organizations } from '../identity/organizations';
import { users } from '../identity/users';
import {
  notificationAudienceEnum,
  notificationDevicePlatformEnum,
  notificationJobStatusEnum,
} from './enums';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data').$type<Record<string, unknown> | null>(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('notifications_organization_id_idx').on(table.organizationId),
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_created_at_idx').on(table.createdAt),
  ],
);

export const notificationDeviceTokens = pgTable(
  'notification_device_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: notificationDevicePlatformEnum('platform').notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('notification_device_tokens_token_unique').on(table.token),
    index('notification_device_tokens_user_id_idx').on(table.userId),
  ],
);

export const notificationJobs = pgTable(
  'notification_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    audience: notificationAudienceEnum('audience').notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    userIds: jsonb('user_ids').$type<string[] | null>(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data').$type<Record<string, unknown> | null>(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: notificationJobStatusEnum('status').notNull().default('PENDING'),
    recipientCount: integer('recipient_count'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    ...timestamps,
  },
  (table) => [
    index('notification_jobs_status_scheduled_at_idx').on(
      table.status,
      table.scheduledAt,
    ),
    index('notification_jobs_actor_id_idx').on(table.actorId),
  ],
);
