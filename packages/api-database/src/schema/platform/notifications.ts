import type { JsonObject } from '@repo/api-core';

import { sql } from 'drizzle-orm';
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

import { organizations } from '../identity/organizations';
import { users } from '../identity/users';
import { timestamps } from '../shared/timestamps';
import {
  notificationAudienceEnum,
  notificationDeliveryStatusEnum,
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
    data: jsonb('data').$type<JsonObject | null>(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    sourceJobId: uuid('source_job_id').references(() => notificationJobs.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('notifications_organization_id_idx').on(table.organizationId),
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_created_at_idx').on(table.createdAt),
    index('notifications_org_user_created_idx').on(
      table.organizationId,
      table.userId,
      table.createdAt,
    ), // Note: Drizzle index ordering (DESC) is usually defined in specific dialect functions or we can omit it for basic indexing
    index('notifications_org_user_unread_idx').on(
      table.organizationId,
      table.userId,
      table.readAt,
    ),
    uniqueIndex('notifications_source_job_id_user_id_unique')
      .on(table.sourceJobId, table.userId)
      .where(sql`${table.sourceJobId} is not null`),
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
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    disabledReason: text('disabled_reason'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('notification_device_tokens_token_unique').on(table.token),
    index('notification_device_tokens_user_id_idx').on(table.userId),
  ],
);

export const notificationDeliveries = pgTable(
  'notification_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    notificationId: uuid('notification_id')
      .notNull()
      .references(() => notifications.id, { onDelete: 'cascade' }),
    deviceTokenId: uuid('device_token_id')
      .notNull()
      .references(() => notificationDeviceTokens.id, { onDelete: 'cascade' }),
    channel: text('channel').notNull().default('fcm'),
    status: notificationDeliveryStatusEnum('status').notNull().default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    providerMessageId: text('provider_message_id'),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    lastError: text('last_error'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('notification_deliveries_unique').on(
      table.notificationId,
      table.deviceTokenId,
      table.channel,
    ),
    index('notification_deliveries_status_next_attempt_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    index('notification_deliveries_notification_id_idx').on(table.notificationId),
    index('notification_deliveries_device_token_id_idx').on(table.deviceTokenId),
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
    data: jsonb('data').$type<JsonObject | null>(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: notificationJobStatusEnum('status').notNull().default('PENDING'),
    recipientCount: integer('recipient_count'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    idempotencyKey: text('idempotency_key'),
    ...timestamps,
  },
  (table) => [
    index('notification_jobs_status_scheduled_at_idx').on(
      table.status,
      table.scheduledAt,
    ),
    index('notification_jobs_actor_id_idx').on(table.actorId),
    uniqueIndex('notification_jobs_org_actor_idempotency_key_unique')
      .on(table.organizationId, table.actorId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);
