import type { TenantContext } from "@repo/api-core";
import type { INestApplication } from "@nestjs/common";

import { TenantContextService, WORKER_DISPATCH_CONTEXT } from "@repo/api-core";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import {
  type DatabaseClient,
  DATABASE,
  notificationDeliveries,
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from "@repo/api-database";

import {
  DELIVERIES_REPOSITORY,
  NotificationDeliveryProcessor,
  NotificationDeliveryUseCase,
  PUSH_NOTIFIER,
} from "@platform";

import { bearer, createTestApp, loginAs, resetTestDatabase } from "./support/test-app";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const dbQuery = async <T>(
  app: INestApplication,
  fn: (db: DatabaseClient) => Promise<T>,
): Promise<T> => {
  const tenantContextService = app.get(TenantContextService);
  const db = app.get(DATABASE);
  // async wrapper keeps the ALS context alive until the lazy drizzle query
  // actually executes (see runWithTenantContext in support/test-app).
  return tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT as TenantContext, async () =>
    fn(db),
  );
};

/** POST /api/v1/admin/notifications and return the job stub. */
const sendNotification = async (
  app: INestApplication,
  admin: { accessToken: string },
  overrides: Record<string, unknown> = {},
) => {
  const response = await request(app.getHttpServer())
    .post("/api/v1/admin/notifications")
    .set(bearer(admin.accessToken))
    .send({
      audience: "ALL",
      type: "test",
      title: "Test notification",
      body: "Test body",
      ...overrides,
    })
    .expect(201);

  return response.body.data as { id: string };
};

/** POST /api/v1/notifications/devices and return the device token stub. */
const registerDevice = async (
  app: INestApplication,
  user: { accessToken: string },
  tokenValue?: string,
) => {
  const response = await request(app.getHttpServer())
    .post("/api/v1/notifications/devices")
    .set(bearer(user.accessToken))
    .send({
      token: tokenValue ?? `fcm-token-${Date.now()}-${Math.random()}`,
      platform: "ANDROID",
    })
    .expect(201);

  return response.body.data as { id: string; token: string };
};

/** Find the delivery row for a given (notificationId, deviceTokenId) pair. */
const findDelivery = (app: INestApplication, notificationId: string, deviceTokenId: string) =>
  dbQuery(app, (db) =>
    db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, notificationId))
      .then((rows) => rows.find((r) => r.deviceTokenId === deviceTokenId)),
  );

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Notifications (e2e)", () => {
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

  // -------------------------------------------------------------------------
  // 1. Inbox idempotency — duplicate job processing must not duplicate rows
  // -------------------------------------------------------------------------

  describe("inbox idempotency", () => {
    it("does not create duplicate inbox rows when the same job is processed twice", async () => {
      const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");

      // sendNotification triggers immediate processJob internally when scheduledAt <= now
      const job = await sendNotification(app, admin);

      // Manually reset the job to PENDING so processJob can run it again.
      // This is the only honest way to test retry idempotency: the job must
      // actually be in a re-processable state.
      await dbQuery(app, (db) =>
        db
          .update(notificationJobs)
          .set({ status: "PENDING", attempts: 0, processedAt: null })
          .where(eq(notificationJobs.id, job.id)),
      );

      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const rows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notifications)
          .where(eq(notifications.sourceJobId, job.id))
          .orderBy(asc(notifications.createdAt)),
      );

      expect(rows.length).toBeGreaterThan(0);

      // Each recipient must appear exactly once — no duplicates
      const uniqueUserIds = new Set(rows.map((r) => r.userId));
      expect(uniqueUserIds.size).toBe(rows.length);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Delivery pipeline — PENDING → SENT via processor
  // -------------------------------------------------------------------------

  describe("delivery pipeline", () => {
    it("creates delivery rows after job processing and marks them SENT", async () => {
      const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
      const device = await registerDevice(app, admin);

      const job = await sendNotification(app, admin);

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

      const notificationId = notificationRows.find((r) => r.userId === admin.userId)!.id;

      const deliveries = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.notificationId, notificationId)),
      );
      expect(deliveries.length).toBeGreaterThan(0);
      expect(deliveries[0]!.deviceTokenId).toBe(device.id);

      // Simulate successful FCM response
      const pushNotifier = app.get<{ sendToToken: ReturnType<typeof vi.fn> }>(PUSH_NOTIFIER);
      pushNotifier.sendToToken = vi.fn().mockResolvedValue({
        success: true,
        providerMessageId: "mock-msg-id",
      });

      const processor = app.get(NotificationDeliveryProcessor);
      await processor.processDeliveries();

      const updated = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.id, deliveries[0]!.id)),
      );
      expect(updated[0]!.status).toBe("SENT");
      expect(updated[0]!.providerMessageId).toBe("mock-msg-id");
    });

    it("disables invalid device tokens and marks delivery as FAILED with a delivery row", async () => {
      const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
      const tokenValue = `invalid-token-${Date.now()}`;
      const device = await registerDevice(app, admin, tokenValue);

      const job = await sendNotification(app, admin);
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      // Find the notification row for the admin user
      const notificationRows = await dbQuery(app, (db) =>
        db.select().from(notifications).where(eq(notifications.sourceJobId, job.id)),
      );
      const notificationId = notificationRows.find((r) => r.userId === admin.userId)!.id;

      // Verify delivery row exists before processing
      const deliveriesBefore = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.notificationId, notificationId)),
      );
      expect(deliveriesBefore.length).toBeGreaterThan(0);
      const deliveryId = deliveriesBefore.find((d) => d.deviceTokenId === device.id)!.id;

      // Simulate FCM reporting the token as invalid
      const pushNotifier = app.get<{ sendToToken: ReturnType<typeof vi.fn> }>(PUSH_NOTIFIER);
      pushNotifier.sendToToken = vi.fn().mockResolvedValue({
        success: false,
        providerMessageId: null,
        error: "INVALID_TOKEN",
      });

      const processor = app.get(NotificationDeliveryProcessor);
      await processor.processDeliveries();

      // Token must be soft-disabled
      const tokens = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeviceTokens)
          .where(eq(notificationDeviceTokens.token, tokenValue)),
      );
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.disabledAt).toBeTruthy();
      expect(tokens[0]!.disabledReason).toBeTruthy();

      // Delivery row must survive and have status FAILED
      const deliveryAfter = await dbQuery(app, (db) =>
        db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, deliveryId)),
      );
      expect(deliveryAfter).toHaveLength(1);
      expect(deliveryAfter[0]!.status).toBe("FAILED");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Retry backoff — nextAttemptAt in future skips claimPending
  // -------------------------------------------------------------------------

  describe("delivery retry backoff", () => {
    it("sets nextAttemptAt with exponential backoff and claimPending skips until due", async () => {
      const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
      const device = await registerDevice(app, admin);
      const job = await sendNotification(app, admin);

      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const notificationRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notifications)
          .where(eq(notifications.sourceJobId, job.id))
          .orderBy(asc(notifications.createdAt)),
      );
      const notificationId = notificationRows.find((r) => r.userId === admin.userId)!.id;

      // Query the delivery row that was already created by processJob — do NOT
      // call upsertBatch again (the unique constraint would return nothing).
      const deliveriesRepo = app.get(DELIVERIES_REPOSITORY);
      const existingRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.notificationId, notificationId)),
      );
      const delivery = existingRows.find((d) => d.deviceTokenId === device.id)!;
      expect(delivery).toBeTruthy();

      const backoffMinutes = 2;
      const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
      await deliveriesRepo.markRetryable(delivery.id, nextAttemptAt);

      const afterRetry = await dbQuery(app, (db) =>
        db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, delivery.id)),
      );
      expect(afterRetry[0]!.status).toBe("PENDING");
      expect(afterRetry[0]!.nextAttemptAt).toBeTruthy();
      expect(new Date(afterRetry[0]!.nextAttemptAt!).getTime()).toBeGreaterThan(Date.now());

      // Delivery must NOT be claimable until nextAttemptAt passes
      const claimed = await deliveriesRepo.claimPending(100);
      expect(claimed.find((c: { id: string }) => c.id === delivery.id)).toBeFalsy();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Stale delivery recovery
  // -------------------------------------------------------------------------

  describe("stale delivery recovery", () => {
    it("recovers PROCESSING deliveries stuck beyond timeout back to PENDING", async () => {
      const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
      const device = await registerDevice(app, admin);
      const job = await sendNotification(app, admin);

      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      const notificationRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notifications)
          .where(eq(notifications.sourceJobId, job.id))
          .orderBy(asc(notifications.createdAt)),
      );
      const notificationId = notificationRows.find((r) => r.userId === admin.userId)!.id;

      // Query the delivery row created by processJob
      const existingRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.notificationId, notificationId)),
      );
      const delivery = existingRows.find((d) => d.deviceTokenId === device.id)!;
      expect(delivery).toBeTruthy();

      // Simulate a stale PROCESSING row (updatedAt in the past)
      await dbQuery(app, (db) =>
        db
          .update(notificationDeliveries)
          .set({
            status: "PROCESSING",
            updatedAt: new Date(Date.now() - 5 * 60 * 1000),
          })
          .where(eq(notificationDeliveries.id, delivery.id)),
      );

      const deliveriesRepo = app.get(DELIVERIES_REPOSITORY);
      const recovered = await deliveriesRepo.recoverStaleProcessing(1);

      expect(recovered.length).toBeGreaterThan(0);
      expect(recovered.find((r: { id: string }) => r.id === delivery.id)).toBeTruthy();

      const after = await dbQuery(app, (db) =>
        db.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, delivery.id)),
      );
      // Under attempt cap → should be PENDING
      expect(after[0]!.status).toBe("PENDING");
    });
  });

  // -------------------------------------------------------------------------
  // 5. Token ownership transfer — cross-account push must NOT happen
  // -------------------------------------------------------------------------

  describe("token ownership transfer", () => {
    it("invalidates pending deliveries and prevents push when token is re-registered by another user", async () => {
      const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");

      // Use a fixed token value so user B can re-register the same string
      const sharedToken = `shared-token-${Date.now()}`;

      // Step 1: User A (admin) registers the token
      const deviceA = await registerDevice(app, admin, sharedToken);
      expect(deviceA.token).toBe(sharedToken);

      // Step 2: Send a notification to ALL users (includes admin) and process it
      const job = await sendNotification(app, admin);
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      // Delivery row must exist and be PENDING for user A's token
      const notificationRows = await dbQuery(app, (db) =>
        db.select().from(notifications).where(eq(notifications.sourceJobId, job.id)),
      );
      const notificationId = notificationRows.find((r) => r.userId === admin.userId)!.id;
      const deliveryBefore = await findDelivery(app, notificationId, deviceA.id);
      expect(deliveryBefore).toBeTruthy();
      expect(deliveryBefore!.status).toBe("PENDING");

      // Step 3: User B registers the SAME token (ownership transfer)
      const userB = await loginAs(app, "user@example.local", "ChangeMe123!");

      await registerDevice(app, userB, sharedToken);

      // Step 4: The old device row (deviceA.id) must now be disabled
      const tokenRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeviceTokens)
          .where(eq(notificationDeviceTokens.token, sharedToken)),
      );
      // Exactly two rows: old disabled + new active
      expect(tokenRows.length).toBe(2);
      const oldRow = tokenRows.find((r) => r.id === deviceA.id)!;
      expect(oldRow.disabledAt).toBeTruthy();

      // Step 5: The pending delivery for user A must have been invalidated
      const deliveryAfterTransfer = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.id, deliveryBefore!.id)),
      );
      expect(deliveryAfterTransfer[0]!.status).toBe("FAILED");

      // Step 6: Running the processor must NOT call sendToToken for the
      // invalidated delivery (it is already FAILED, not claimable)
      const pushNotifier = app.get<{ sendToToken: ReturnType<typeof vi.fn> }>(PUSH_NOTIFIER);
      pushNotifier.sendToToken = vi.fn().mockResolvedValue({
        success: true,
        providerMessageId: "should-not-be-called",
      });

      const processor = app.get(NotificationDeliveryProcessor);
      await processor.processDeliveries();

      // sendToToken must not have been called with the original device token
      const calledTokens = pushNotifier.sendToToken.mock.calls.map((args) => args[0] as string);
      expect(calledTokens).not.toContain(sharedToken);
    });

    it("rejects concurrent register when processor holds the token lock", async () => {
      const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
      const userB = await loginAs(app, "user@example.local", "ChangeMe123!");
      const sharedToken = `concurrent-token-${Date.now()}`;

      // Step 1: Admin registers T
      const deviceA = await registerDevice(app, admin, sharedToken);

      // Step 2: Create notification and processJob (creates PENDING delivery)
      const job = await sendNotification(app, admin);
      const useCase = app.get(NotificationDeliveryUseCase);
      await useCase.processJob(job.id);

      // Step 3: Find the exact delivery for sharedToken
      const notificationRows = await dbQuery(app, (db) =>
        db.select().from(notifications).where(eq(notifications.sourceJobId, job.id)),
      );
      const notificationId = notificationRows.find((r) => r.userId === admin.userId)!.id;
      const exactDelivery = await findDelivery(app, notificationId, deviceA.id);
      expect(exactDelivery).toBeTruthy();
      expect(exactDelivery!.status).toBe("PENDING");

      // Move all other PENDING deliveries to FAILED so the processor batch
      // only contains the exact delivery for sharedToken.
      await dbQuery(app, (db) =>
        db
          .update(notificationDeliveries)
          .set({
            status: "FAILED",
            lastError: "Cleared for concurrent test isolation",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notificationDeliveries.status, "PENDING"),
              ne(notificationDeliveries.id, exactDelivery!.id),
            ),
          ),
      );

      // Confirm only our target delivery is PENDING
      const remainingPending = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.status, "PENDING")),
      );
      expect(remainingPending).toHaveLength(1);
      expect(remainingPending[0]!.id).toBe(exactDelivery!.id);

      // Step 4: Set up a barrier — sendToToken will pause until we resolve it
      const sendStarted = (() => {
        let resolve!: () => void;
        const promise = new Promise<void>((r) => {
          resolve = r;
        });
        return { promise, resolve };
      })();
      const allowSend = (() => {
        let resolve!: () => void;
        const promise = new Promise<void>((r) => {
          resolve = r;
        });
        return { promise, resolve };
      })();

      const pushNotifier = app.get<{ sendToToken: ReturnType<typeof vi.fn> }>(PUSH_NOTIFIER);
      pushNotifier.sendToToken = vi.fn().mockImplementation(async (token: string) => {
        expect(token).toBe(sharedToken);
        sendStarted.resolve();
        await allowSend.promise;
        return { success: true, providerMessageId: "mock-barrier-msg" };
      });

      // Step 5: Start the processor in the background
      const processor = app.get(NotificationDeliveryProcessor);
      const processorPromise = processor.processDeliveries();

      try {
        // Wait for sendToToken to be called (processor holds the lock now)
        await vi.waitFor(() => {
          expect(pushNotifier.sendToToken).toHaveBeenCalled();
        });

        // Step 6: Try to register the same token for user B while lock is held
        const conflictResponse = await request(app.getHttpServer())
          .post("/api/v1/notifications/devices")
          .set(bearer(userB.accessToken))
          .send({ token: sharedToken, platform: "ANDROID" })
          .expect(409);

        expect(conflictResponse.body).toBeDefined();
      } finally {
        // Always release the barrier so the processor can finish
        allowSend.resolve();
        await processorPromise;
      }

      // Step 7: Now retry the registration — should succeed (transfer)
      await request(app.getHttpServer())
        .post("/api/v1/notifications/devices")
        .set(bearer(userB.accessToken))
        .send({ token: sharedToken, platform: "ANDROID" })
        .expect(201);

      // Step 8: Verify final state — only 1 active row, owned by userB
      const finalTokens = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeviceTokens)
          .where(eq(notificationDeviceTokens.token, sharedToken)),
      );
      const activeFinal = finalTokens.filter((t) => !t.disabledAt);
      expect(activeFinal).toHaveLength(1);
      expect(activeFinal[0]!.userId).toBe(userB.userId);
    });

    it("does not violate unique constraint when same user re-registers after transfer", async () => {
      const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
      const userB = await loginAs(app, "user@example.local", "ChangeMe123!");
      const sharedToken = `re-register-token-${Date.now()}`;

      // A register T
      await registerDevice(app, admin, sharedToken);

      // B transfer T (admin → userB)
      await registerDevice(app, userB, sharedToken);

      // DB: A-disabled + B-active
      const afterTransfer = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeviceTokens)
          .where(eq(notificationDeviceTokens.token, sharedToken)),
      );
      expect(afterTransfer.length).toBe(2);
      const activeAfterTransfer = afterTransfer.filter((r) => !r.disabledAt);
      expect(activeAfterTransfer).toHaveLength(1);
      expect(activeAfterTransfer[0]!.userId).toBe(userB.userId);

      // B register T again — must NOT throw unique violation
      // The repository should find the existing active row (same owner) and
      // simply touch it instead of attempting a duplicate insert.
      const result = await registerDevice(app, userB, sharedToken);
      expect(result.token).toBe(sharedToken);

      const finalRows = await dbQuery(app, (db) =>
        db
          .select()
          .from(notificationDeviceTokens)
          .where(eq(notificationDeviceTokens.token, sharedToken)),
      );
      // Still exactly 2 rows: A-disabled + B-active (no duplicate)
      expect(finalRows.length).toBe(2);
      const activeFinal = finalRows.filter((r) => !r.disabledAt);
      expect(activeFinal).toHaveLength(1);
      expect(activeFinal[0]!.userId).toBe(userB.userId);
    });
  });
});
