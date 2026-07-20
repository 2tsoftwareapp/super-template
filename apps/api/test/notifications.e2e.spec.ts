import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { eq } from 'drizzle-orm';
import {
  DATABASE,
  notificationDeliveries,
  notificationDeviceTokens,
  notifications,
} from '@repo/api-database';

import { bearer, createTestApp, loginAs, resetTestDatabase } from './support/test-app';

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

      const { NotificationDeliveryUseCase } = require('@repo/api-platform');
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);
      await useCase.processJob(job.id);

      const db = app.get(DATABASE);
      const rows = await db.select().from(notifications).where(eq(notifications.sourceJobId, job.id));
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

      const { NotificationDeliveryUseCase, NotificationDeliveryProcessor, PUSH_NOTIFIER } = require('@repo/api-platform');
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const db = app.get(DATABASE);
      const notificationRows = await db.select().from(notifications).where(eq(notifications.sourceJobId, job.id));
      expect(notificationRows.length).toBeGreaterThan(0);

      const notificationId = notificationRows[0].id;
      const deliveries = await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.notificationId, notificationId));
      expect(deliveries.length).toBeGreaterThan(0);
      expect(deliveries[0].status).toBe('PENDING');
      expect(deliveries[0].deviceTokenId).toBe(device.id);

      const processor = app.get(NotificationDeliveryProcessor);
      const pushNotifier = app.get(PUSH_NOTIFIER);
      pushNotifier.sendToToken = async () => ({ success: true, providerMessageId: 'mock-msg-id' });

      await processor.processDeliveries();

      const updated = await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, deliveries[0].id));
      expect(updated[0].status).toBe('SENT');
      expect(updated[0].providerMessageId).toBe('mock-msg-id');
    });

    it('removes invalid device tokens and marks delivery as FAILED', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const tokenValue = `invalid-token-${Date.now()}`;
      await request(app.getHttpServer())
        .post('/api/v1/notifications/devices')
        .set(bearer(admin.accessToken))
        .send({ token: tokenValue, platform: 'ANDROID' })
        .expect(201);

      const job = await sendNotification(admin);
      const { NotificationDeliveryUseCase, NotificationDeliveryProcessor, PUSH_NOTIFIER } = require('@repo/api-platform');
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const pushNotifier = app.get(PUSH_NOTIFIER);
      pushNotifier.sendToToken = async () => ({
        success: false,
        providerMessageId: null,
        error: 'INVALID_TOKEN',
      });

      const db = app.get(DATABASE);
      const processor = app.get(NotificationDeliveryProcessor);
      await processor.processDeliveries();

      const tokens = await db.select().from(notificationDeviceTokens).where(eq(notificationDeviceTokens.token, tokenValue));
      expect(tokens).toHaveLength(0);
    });
  });

  describe('delivery retry backoff', () => {
    it('sets nextAttemptAt with exponential backoff and claimPending skips until due', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const device = await registerDevice(admin);
      const job = await sendNotification(admin);

      const { NotificationDeliveryUseCase, DELIVERIES_REPOSITORY } = require('@repo/api-platform');
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const db = app.get(DATABASE);

      const notificationRows = await db.select().from(notifications).where(eq(notifications.sourceJobId, job.id));
      expect(notificationRows.length).toBeGreaterThan(0);
      const notificationId = notificationRows[0].id;

      const deliveriesRepo = app.get(DELIVERIES_REPOSITORY);
      const [delivery] = await deliveriesRepo.upsertBatch([
        { notificationId, deviceTokenId: device.id, channel: 'fcm' },
      ]);

      const backoffMinutes = 2;
      const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
      await deliveriesRepo.markRetryable(delivery.id, nextAttemptAt);

      const afterRetry = await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, delivery.id));
      expect(afterRetry[0].status).toBe('PENDING');
      expect(afterRetry[0].nextAttemptAt).toBeTruthy();
      expect(new Date(afterRetry[0].nextAttemptAt!).getTime()).toBeGreaterThan(Date.now());

      const claimed = await deliveriesRepo.claimPending(100);
      expect(claimed.find((c: { id: string }) => c.id === delivery.id)).toBeFalsy();
    });
  });

  describe('stale recovery', () => {
    it('recovers PROCESSING deliveries stuck beyond timeout back to PENDING', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const device = await registerDevice(admin);
      const job = await sendNotification(admin);

      const { NotificationDeliveryUseCase, DELIVERIES_REPOSITORY } = require('@repo/api-platform');
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const db = app.get(DATABASE);

      const notificationRows = await db.select().from(notifications).where(eq(notifications.sourceJobId, job.id));
      expect(notificationRows.length).toBeGreaterThan(0);
      const notificationId = notificationRows[0].id;

      const deliveriesRepo = app.get(DELIVERIES_REPOSITORY);
      const [delivery] = await deliveriesRepo.upsertBatch([
        { notificationId, deviceTokenId: device.id, channel: 'fcm' },
      ]);

      await db.update(notificationDeliveries)
        .set({
          status: 'PROCESSING',
          updatedAt: new Date(Date.now() - 5 * 60 * 1000),
        })
        .where(eq(notificationDeliveries.id, delivery.id));

      const recovered = await deliveriesRepo.recoverStaleProcessing(1);

      expect(recovered.length).toBeGreaterThan(0);
      expect(recovered.find((r: { id: string }) => r.id === delivery.id)).toBeTruthy();

      const after = await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, delivery.id));
      expect(after[0].status).toBe('PENDING');
    });
  });
});
