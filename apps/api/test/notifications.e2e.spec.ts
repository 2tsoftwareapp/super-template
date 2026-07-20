import type { TenantContext } from '@repo/api-core';
import type { INestApplication } from '@nestjs/common';

import { TenantContextService, WORKER_DISPATCH_CONTEXT } from '@repo/api-core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asc, eq } from 'drizzle-orm';
import { type DatabaseClient, DATABASE, notificationDeliveries, notificationDeviceTokens, notifications } from '@repo/api-database';

import {
  DELIVERIES_REPOSITORY,
  NotificationDeliveryProcessor,
  NotificationDeliveryUseCase,
  PUSH_NOTIFIER,
} from '@repo/api-platform';

import {
  bearer,
  createTestApp,
  loginAs,
  resetTestDatabase,
} from './support/test-app';

const dbQuery = async <T>(app: INestApplication, fn: (db: DatabaseClient) => Promise<T>): Promise<T> => {
  const tenantContextService = app.get(TenantContextService);
  const db = app.get(DATABASE);
  return tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT as TenantContext, () => fn(db));
};

describe('Notifications (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await resetTestDatabase();
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const sendNotification = async (
    admin: { accessToken: string },
    overrides: Record<string, unknown> = {},
  ) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/notifications')
      .set(bearer(admin.accessToken))
      .send({
        audience: 'ALL',
        type: 'test',
        title: 'Test notification',
        body: 'Test body',
        ...overrides,
      })
      .expect(201);

    return response.body.data as { id: string };
  };

  const registerDevice = async (user: { accessToken: string }) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/notifications/devices')
      .set(bearer(user.accessToken))
      .send({ token: `fcm-token-${Date.now()}`, platform: 'ANDROID' })
      .expect(201);

    return response.body.data as { id: string; token: string };
  };

  describe('ON CONFLICT WHERE predicate', () => {
    it('does not create duplicate inbox rows when retrying same job', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const job = await sendNotification(admin);

      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);
      await useCase.processJob(job.id);

      const db = app.get(DATABASE);
      const rows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notifications)
          .where(eq(notifications.sourceJobId, job.id))
          .orderBy(asc(notifications.createdAt)),
      );
      expect(rows.length).toBeGreaterThan(0);
      const uniqueUserIds = new Set(rows.map((r: { userId: string }) => r.userId));
      expect(uniqueUserIds.size).toBe(rows.length);
    });
  });

  describe('delivery pipeline', () => {
    it('creates delivery rows when upserting notifications and marks them as SENT after processing', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const device = await registerDevice(admin);

      const job = await sendNotification(admin);

      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const notificationRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notifications)
          .where(eq(notifications.sourceJobId, job.id))
          .orderBy(asc(notifications.createdAt)),
      );
      expect(notificationRows.length).toBeGreaterThan(0);

      const notificationId = notificationRows.find(
        (r: { userId: string }) => r.userId === admin.userId,
      )!.id;
      const deliveries = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.notificationId, notificationId)),
      );
      expect(deliveries.length).toBeGreaterThan(0);
      expect(deliveries[0]!.status).toBe('PENDING');
      expect(deliveries[0]!.deviceTokenId).toBe(device.id);

      const processor = app.get(NotificationDeliveryProcessor);
      const pushNotifier = app.get<{ sendToToken: Function }>(PUSH_NOTIFIER);
      pushNotifier.sendToToken = async () => ({ success: true, providerMessageId: 'mock-msg-id' });

      await processor.processDeliveries();

      const updated = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.id, deliveries[0]!.id)),
      );
      expect(updated[0]!.status).toBe('SENT');
      expect(updated[0]!.providerMessageId).toBe('mock-msg-id');
    });

    it('disables invalid device tokens and marks delivery as FAILED', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const tokenValue = `invalid-token-${Date.now()}`;
      await request(app.getHttpServer())
        .post('/api/v1/notifications/devices')
        .set(bearer(admin.accessToken))
        .send({ token: tokenValue, platform: 'ANDROID' })
        .expect(201);

      const job = await sendNotification(admin);
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const pushNotifier = app.get<{ sendToToken: Function }>(PUSH_NOTIFIER);
      pushNotifier.sendToToken = async () => ({
        success: false,
        providerMessageId: null,
        error: 'INVALID_TOKEN',
      });

      const processor = app.get(NotificationDeliveryProcessor);
      await processor.processDeliveries();

      const tokens = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeviceTokens)
          .where(eq(notificationDeviceTokens.token, tokenValue)),
      );
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.disabledAt).toBeTruthy();
      expect(tokens[0]!.disabledReason).toBeTruthy();
    });
  });

  describe('delivery retry backoff', () => {
    it('sets nextAttemptAt with exponential backoff and claimPending skips until due', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const device = await registerDevice(admin);
      const job = await sendNotification(admin);

      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const notificationRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notifications)
          .where(eq(notifications.sourceJobId, job.id))
          .orderBy(asc(notifications.createdAt)),
      );
      expect(notificationRows.length).toBeGreaterThan(0);
      const notificationId = notificationRows.find(
        (r: { userId: string }) => r.userId === admin.userId,
      )!.id;

      const deliveriesRepo = app.get(DELIVERIES_REPOSITORY);
      const [delivery] = await deliveriesRepo.upsertBatch([
        { notificationId, deviceTokenId: device.id, channel: 'fcm' },
      ]);

      const backoffMinutes = 2;
      const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
      await deliveriesRepo.markRetryable(delivery.id, nextAttemptAt);

      const afterRetry = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.id, delivery.id)),
      );
      expect(afterRetry[0]!.status).toBe('PENDING');
      expect(afterRetry[0]!.nextAttemptAt).toBeTruthy();
      expect(new Date(afterRetry[0]!.nextAttemptAt!).getTime()).toBeGreaterThan(Date.now());

      const claimed = await deliveriesRepo.claimPending(100);
      expect(claimed.find((c: { id: string }) => c.id === delivery.id)).toBeFalsy();
    });
  });

  describe('stale recovery', () => {
    it('recovers PROCESSING deliveries stuck beyond timeout back to PENDING', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const device = await registerDevice(admin);
      const job = await sendNotification(admin);

      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const notificationRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notifications)
          .where(eq(notifications.sourceJobId, job.id))
          .orderBy(asc(notifications.createdAt)),
      );
      expect(notificationRows.length).toBeGreaterThan(0);
      const notificationId = notificationRows.find(
        (r: { userId: string }) => r.userId === admin.userId,
      )!.id;

      const deliveriesRepo = app.get(DELIVERIES_REPOSITORY);
      const [delivery] = await deliveriesRepo.upsertBatch([
        { notificationId, deviceTokenId: device.id, channel: 'fcm' },
      ]);

      await dbQuery(app, (db) =>
        db
          .update(notificationDeliveries)
          .set({
            status: 'PROCESSING',
            updatedAt: new Date(Date.now() - 5 * 60 * 1000),
          })
          .where(eq(notificationDeliveries.id, delivery.id)),
      );

      const recovered = await deliveriesRepo.recoverStaleProcessing(1);

      expect(recovered.length).toBeGreaterThan(0);
      expect(recovered.find((r: { id: string }) => r.id === delivery.id)).toBeTruthy();

      const after = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.id, delivery.id)),
      );
      expect(after[0]!.status).toBe('PENDING');
    });
  });
});
