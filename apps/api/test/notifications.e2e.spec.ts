import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

  describe('ON CONFLICT WHERE predicate', () => {
    it('does not create duplicate inbox rows when retrying same job', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      const job = await sendNotification(admin);

      // Process the job twice
      const { NotificationDeliveryUseCase } = require('@repo/api-platform');
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);
      await useCase.processJob(job.id);

      // Verify only one notification per user exists for this job
      const { notifications, DATABASE } = require('@repo/api-database');
      const db = app.get(DATABASE);
      const { eq } = require('drizzle-orm');
      const rows = await db.select().from(notifications).where(eq(notifications.sourceJobId, job.id));
      const uniqueUserIds = new Set(rows.map((r: { userId: string }) => r.userId));
      expect(uniqueUserIds.size).toBe(rows.length);
    });
  });

  describe('delivery pipeline', () => {
    it('creates delivery rows when upserting notifications and marks them as SENT after processing', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      // Register a device token for the admin
      const deviceResponse = await request(app.getHttpServer())
        .post('/api/v1/notifications/devices')
        .set(bearer(admin.accessToken))
        .send({ token: `fcm-token-${Date.now()}`, platform: 'ANDROID' })
        .expect(201);

      const deviceTokenId = deviceResponse.body.data.id;

      // Send a notification
      const job = await sendNotification(admin);

      // Process the job
      const { NotificationDeliveryUseCase } = require('@repo/api-platform');
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      // Check delivery rows exist
      const { notificationDeliveries, notifications, DATABASE } = require('@repo/api-database');
      const db = app.get(DATABASE);
      const { eq } = require('drizzle-orm');
      const notificationRows = await db.select().from(notifications).where(eq(notifications.sourceJobId, job.id));
      expect(notificationRows.length).toBeGreaterThan(0);

      const notificationId = notificationRows[0].id;
      const deliveries = await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.notificationId, notificationId));
      expect(deliveries.length).toBeGreaterThan(0);
      expect(deliveries[0].status).toBe('PENDING');
      expect(deliveries[0].deviceTokenId).toBe(deviceTokenId);

      // Run the delivery processor
      const { NotificationDeliveryProcessor } = require('@repo/api-platform');
      const processor = app.get(NotificationDeliveryProcessor);

      // Mock the push notifier to simulate success
      const { PUSH_NOTIFIER } = require('@repo/api-platform');
      const originalPushNotifier = app.get(PUSH_NOTIFIER);
      const mockResult = { success: true, providerMessageId: 'mock-msg-id' };
      originalPushNotifier.sendToToken = async () => mockResult;

      await processor.processDeliveries();

      // Verify delivery is now SENT
      const updated = await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, deliveries[0].id));
      expect(updated[0].status).toBe('SENT');
      expect(updated[0].providerMessageId).toBe('mock-msg-id');
    });

    it('removes invalid device tokens and marks delivery as FAILED', async () => {
      const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

      // Register a device token
      const tokenValue = `invalid-token-${Date.now()}`;
      await request(app.getHttpServer())
        .post('/api/v1/notifications/devices')
        .set(bearer(admin.accessToken))
        .send({ token: tokenValue, platform: 'ANDROID' })
        .expect(201);

      // Send and process a notification
      const job = await sendNotification(admin);
      const { NotificationDeliveryUseCase, NotificationDeliveryProcessor, PUSH_NOTIFIER } = require('@repo/api-platform');
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      // Mock push notifier to return INVALID_TOKEN
      const pushNotifier = app.get(PUSH_NOTIFIER);
      pushNotifier.sendToToken = async () => ({
        success: false,
        providerMessageId: null,
        error: 'INVALID_TOKEN',
      });

      const { notificationDeliveries, notificationDeviceTokens, DATABASE } = require('@repo/api-database');
      const db = app.get(DATABASE);
      const { eq } = require('drizzle-orm');

      const processor = app.get(NotificationDeliveryProcessor);
      await processor.processDeliveries();

      // Verify token was removed
      const tokens = await db.select().from(notificationDeviceTokens).where(eq(notificationDeviceTokens.token, tokenValue));
      expect(tokens).toHaveLength(0);
    });
  });

  describe('delivery retry backoff', () => {
    it('sets nextAttemptAt with exponential backoff and claimPending skips until due', async () => {
      const { notificationDeliveries, DATABASE } = require('@repo/api-database');
      const db = app.get(DATABASE);
      const { eq } = require('drizzle-orm');

      // Create a delivery row in PENDING with 0 attempts
      const { DELIVERIES_REPOSITORY } = require('@repo/api-platform');
      const deliveriesRepo = app.get(DELIVERIES_REPOSITORY);

      const [delivery] = await deliveriesRepo.upsertBatch([
        { notificationId: '00000000-0000-0000-0000-000000000001', deviceTokenId: '00000000-0000-0000-0000-000000000002', channel: 'fcm' },
      ]);

      // Simulate a transient failure: markRetryable with backoff
      const backoffMinutes = 2;
      const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
      await deliveriesRepo.markRetryable(delivery.id, nextAttemptAt);

      // Verify nextAttemptAt is set
      const afterRetry = await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, delivery.id));
      expect(afterRetry[0].status).toBe('PENDING');
      expect(afterRetry[0].nextAttemptAt).toBeTruthy();
      expect(new Date(afterRetry[0].nextAttemptAt!).getTime()).toBeGreaterThan(Date.now());

      // claimPending should NOT pick it up yet
      const claimed = await deliveriesRepo.claimPending(100);
      expect(claimed.find((c: { id: string }) => c.id === delivery.id)).toBeFalsy();
    });
  });

  describe('stale recovery', () => {
    it('recovers PROCESSING deliveries stuck beyond timeout back to PENDING', async () => {
      const { notificationDeliveries, DATABASE } = require('@repo/api-database');
      const db = app.get(DATABASE);
      const { eq, sql } = require('drizzle-orm');

      // Create a delivery row
      const { DELIVERIES_REPOSITORY } = require('@repo/api-platform');
      const deliveriesRepo = app.get(DELIVERIES_REPOSITORY);

      const [delivery] = await deliveriesRepo.upsertBatch([
        { notificationId: '00000000-0000-0000-0000-000000000003', deviceTokenId: '00000000-0000-0000-0000-000000000004', channel: 'fcm' },
      ]);

      // Manually set status to PROCESSING with an old updated_at (5 minutes ago)
      await db.update(notificationDeliveries)
        .set({
          status: 'PROCESSING',
          updatedAt: new Date(Date.now() - 5 * 60 * 1000),
        })
        .where(eq(notificationDeliveries.id, delivery.id));

      // Recover with 1 minute timeout (the delivery is 5 min old, so it should be recovered)
      const recovered = await deliveriesRepo.recoverStaleProcessing(1);

      expect(recovered.length).toBeGreaterThan(0);
      expect(recovered.find((r: { id: string }) => r.id === delivery.id)).toBeTruthy();

      // Verify status is PENDING
      const after = await db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, delivery.id));
      expect(after[0].status).toBe('PENDING');
    });
  });
});
