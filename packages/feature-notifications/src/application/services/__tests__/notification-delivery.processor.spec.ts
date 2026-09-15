import { afterEach, describe, expect, it, vi } from "vitest";

import { MAX_DELIVERY_RETRY_ATTEMPTS } from "../../../domain/delivery-policy";
import { tokenLockId } from "../../../domain/token-lock";
import { NotificationDeliveryProcessor } from "../notification-delivery.processor";

const TOKEN = "APA91bExampleFCMToken1234567890abcdef";
const START = new Date("2026-09-15T00:00:00.000Z");

const delivery = (overrides: Record<string, unknown> = {}) => ({
  id: "delivery-1",
  notificationId: "notification-1",
  deviceTokenId: "token-row-1",
  attempts: 1,
  ...overrides,
});

const notification = (overrides: Record<string, unknown> = {}) => ({
  id: "notification-1",
  userId: "user-1",
  type: "TEST",
  title: "Title",
  body: "Body",
  data: null,
  ...overrides,
});

const deviceToken = (overrides: Record<string, unknown> = {}) => ({
  id: "token-row-1",
  userId: "user-1",
  token: TOKEN,
  ...overrides,
});

/**
 * Builds the processor over fake ports and records a timeline of lock and send
 * events, so a test can prove the FCM send happens *inside* the per-token lock
 * rather than merely that the lock was requested.
 */
function buildProcessor(
  options: {
    deliveries?: unknown[];
    notifications?: unknown[];
    tokens?: unknown[];
    freshToken?: unknown;
    sendResult?: unknown;
    lockResult?: unknown;
  } = {},
) {
  const {
    deliveries = [delivery()],
    notifications = [notification()],
    tokens = [deviceToken()],
    freshToken = deviceToken(),
    sendResult = { success: true, providerMessageId: "provider-1" },
    lockResult,
  } = options;

  const events: string[] = [];

  const deliveriesRepository = {
    claimPending: vi.fn(async () => deliveries),
    markSentIfProcessing: vi.fn(async () => ({ id: "delivery-1" })),
    markFailed: vi.fn(async () => ({ id: "delivery-1" })),
    markRetryable: vi.fn(async () => ({ id: "delivery-1" })),
    recoverStaleProcessing: vi.fn(async () => []),
  };
  const notificationsRepository = {
    findById: vi.fn(
      async (id: string) => notifications.find((n) => (n as { id: string }).id === id) ?? null,
    ),
  };
  const deviceTokensRepository = {
    listByIds: vi.fn(async () => tokens),
    listActiveByToken: vi.fn(async () => freshToken),
    disableTokens: vi.fn(async () => undefined),
  };
  const pushNotifier = {
    sendToToken: vi.fn(async () => {
      events.push("send");
      return sendResult;
    }),
  };
  const advisoryLock = {
    withAdvisoryLock: vi.fn(async (lockId: number, run: () => Promise<unknown>) => {
      if (lockResult === null) {
        return null;
      }
      events.push(`lock:acquire:${lockId}`);
      try {
        return await run();
      } finally {
        events.push(`lock:release:${lockId}`);
      }
    }),
  };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const errorReporter = { reportException: vi.fn(), reportMessage: vi.fn() };
  const tenantContextService = {
    runAsync: vi.fn(async (_context: unknown, run: () => Promise<unknown>) => run()),
  };

  const processor = new NotificationDeliveryProcessor(
    deliveriesRepository as never,
    notificationsRepository as never,
    deviceTokensRepository as never,
    pushNotifier as never,
    advisoryLock as never,
    logger as never,
    errorReporter as never,
    tenantContextService as never,
  );

  return {
    processor,
    events,
    deliveriesRepository,
    notificationsRepository,
    deviceTokensRepository,
    pushNotifier,
    advisoryLock,
    logger,
    errorReporter,
    tenantContextService,
  };
}

describe("NotificationDeliveryProcessor.processDeliveries", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("claims a batch and does nothing else when there is no work", async () => {
    const { processor, deliveriesRepository, notificationsRepository, advisoryLock } =
      buildProcessor({ deliveries: [] });

    await processor.processDeliveries();

    expect(deliveriesRepository.claimPending).toHaveBeenCalledWith(50);
    expect(notificationsRepository.findById).not.toHaveBeenCalled();
    expect(advisoryLock.withAdvisoryLock).not.toHaveBeenCalled();
  });

  it("reads each notification and token row once for the whole batch", async () => {
    const { processor, notificationsRepository, deviceTokensRepository } = buildProcessor({
      deliveries: [
        delivery({ id: "delivery-1" }),
        delivery({ id: "delivery-2" }),
        delivery({
          id: "delivery-3",
          notificationId: "notification-2",
          deviceTokenId: "token-row-2",
        }),
      ],
      notifications: [notification(), notification({ id: "notification-2" })],
      tokens: [deviceToken(), deviceToken({ id: "token-row-2" })],
    });

    await processor.processDeliveries();

    // Duplicated ids are collapsed: two notifications and two token rows.
    expect(notificationsRepository.findById).toHaveBeenCalledTimes(2);
    expect(deviceTokensRepository.listByIds).toHaveBeenCalledTimes(1);
    expect(deviceTokensRepository.listByIds).toHaveBeenCalledWith(["token-row-1", "token-row-2"]);
  });

  it("sends FCM while holding the per-token advisory lock", async () => {
    const { processor, advisoryLock, pushNotifier, deliveriesRepository, events } =
      buildProcessor();

    await processor.processDeliveries();

    const expectedLock = tokenLockId(TOKEN);
    expect(advisoryLock.withAdvisoryLock).toHaveBeenCalledTimes(1);
    expect(advisoryLock.withAdvisoryLock.mock.calls[0]![0]).toBe(expectedLock);

    // The lock id is a pure function of the token the producer also locks on,
    // so acquire/send/release must nest in that order.
    expect(events).toEqual([
      `lock:acquire:${expectedLock}`,
      "send",
      `lock:release:${expectedLock}`,
    ]);
    expect(pushNotifier.sendToToken).toHaveBeenCalledWith(TOKEN, {
      notificationId: "notification-1",
      type: "TEST",
      title: "Title",
      body: "Body",
      data: null,
    });
    expect(deliveriesRepository.markSentIfProcessing).toHaveBeenCalledWith(
      "delivery-1",
      "provider-1",
    );
  });

  it("fails a delivery whose notification row is gone without taking a lock", async () => {
    const { processor, deliveriesRepository, advisoryLock } = buildProcessor({
      notifications: [],
    });

    await processor.processDeliveries();

    expect(deliveriesRepository.markFailed).toHaveBeenCalledWith(
      "delivery-1",
      "Missing notification or device token",
    );
    expect(advisoryLock.withAdvisoryLock).not.toHaveBeenCalled();
  });

  it("fails a delivery whose device token row is gone", async () => {
    const { processor, deliveriesRepository, pushNotifier } = buildProcessor({ tokens: [] });

    await processor.processDeliveries();

    expect(deliveriesRepository.markFailed).toHaveBeenCalledWith(
      "delivery-1",
      "Missing notification or device token",
    );
    expect(pushNotifier.sendToToken).not.toHaveBeenCalled();
  });

  it("re-reads the token inside the lock and fails when it was deactivated", async () => {
    const { processor, deliveriesRepository, deviceTokensRepository, pushNotifier } =
      buildProcessor({ freshToken: null });

    await processor.processDeliveries();

    expect(deviceTokensRepository.listActiveByToken).toHaveBeenCalledWith(TOKEN);
    expect(deliveriesRepository.markFailed).toHaveBeenCalledWith(
      "delivery-1",
      "Device token was deactivated before send",
    );
    expect(pushNotifier.sendToToken).not.toHaveBeenCalled();
  });

  it("fails when the token was transferred to another account after the claim", async () => {
    const { processor, deliveriesRepository, pushNotifier } = buildProcessor({
      freshToken: deviceToken({ userId: "user-2" }),
    });

    await processor.processDeliveries();

    expect(deliveriesRepository.markFailed).toHaveBeenCalledWith(
      "delivery-1",
      "Notification owner does not match device token owner after re-check",
    );
    // Nothing is pushed to a device that now belongs to someone else.
    expect(pushNotifier.sendToToken).not.toHaveBeenCalled();
  });

  it("disables the token and fails the delivery on INVALID_TOKEN", async () => {
    const { processor, deviceTokensRepository, deliveriesRepository } = buildProcessor({
      sendResult: { success: false, error: "INVALID_TOKEN" },
      deliveries: [delivery({ attempts: MAX_DELIVERY_RETRY_ATTEMPTS - 1 })],
    });

    await processor.processDeliveries();

    expect(deviceTokensRepository.disableTokens).toHaveBeenCalledWith(
      [TOKEN],
      "FCM returned INVALID_TOKEN",
    );
    // A permanently invalid token is never retried, even with attempts left.
    expect(deliveriesRepository.markFailed).toHaveBeenCalledWith(
      "delivery-1",
      "Invalid device token",
    );
    expect(deliveriesRepository.markRetryable).not.toHaveBeenCalled();
  });

  it("gives up with a max-retries failure once the attempt budget is spent", async () => {
    const { processor, deliveriesRepository } = buildProcessor({
      sendResult: { success: false, error: "UNAVAILABLE" },
      deliveries: [delivery({ attempts: MAX_DELIVERY_RETRY_ATTEMPTS })],
    });

    await processor.processDeliveries();

    expect(deliveriesRepository.markFailed).toHaveBeenCalledWith(
      "delivery-1",
      "Max retries exceeded: UNAVAILABLE",
    );
    expect(deliveriesRepository.markRetryable).not.toHaveBeenCalled();
  });

  it("still retries one attempt below the budget", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    const { processor, deliveriesRepository } = buildProcessor({
      sendResult: { success: false, error: "UNAVAILABLE" },
      deliveries: [delivery({ attempts: MAX_DELIVERY_RETRY_ATTEMPTS - 1 })],
    });

    await processor.processDeliveries();

    expect(deliveriesRepository.markRetryable).toHaveBeenCalledTimes(1);
    expect(deliveriesRepository.markFailed).not.toHaveBeenCalled();
  });

  it.each([
    [1, 1],
    [2, 2],
    [3, 4],
    [4, 8],
  ])(
    "backs off exponentially: attempt %i retries in %i minute(s)",
    async (attempts, expectedMinutes) => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const { processor, deliveriesRepository } = buildProcessor({
        sendResult: { success: false, error: "UNAVAILABLE" },
        deliveries: [delivery({ attempts })],
      });

      await processor.processDeliveries();

      const [deliveryId, nextAttemptAt] = deliveriesRepository.markRetryable.mock
        .calls[0]! as unknown as [string, Date];
      expect(deliveryId).toBe("delivery-1");
      expect(nextAttemptAt.getTime()).toBe(START.getTime() + expectedMinutes * 60 * 1000);
    },
  );

  it("leaves the delivery PROCESSING when the token lock is unavailable", async () => {
    const { processor, deliveriesRepository, logger, advisoryLock } = buildProcessor({
      lockResult: null,
    });

    await processor.processDeliveries();

    // No terminal write and no send: stale recovery will reset the row later.
    expect(advisoryLock.withAdvisoryLock).toHaveBeenCalledTimes(1);
    expect(deliveriesRepository.markSentIfProcessing).not.toHaveBeenCalled();
    expect(deliveriesRepository.markFailed).not.toHaveBeenCalled();
    expect(deliveriesRepository.markRetryable).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not acquire token lock"),
    );
  });

  it("warns instead of failing when a transfer superseded the send", async () => {
    const { processor, deliveriesRepository, logger } = buildProcessor();
    deliveriesRepository.markSentIfProcessing.mockResolvedValue(null as never);

    await processor.processDeliveries();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("superseded by token transfer"),
    );
    // A superseded send is not turned into a failure.
    expect(deliveriesRepository.markFailed).not.toHaveBeenCalled();
  });

  it("ignores a concurrent tick while a batch is in flight", async () => {
    const { processor, deliveriesRepository } = buildProcessor();
    let release: (() => void) | undefined;
    deliveriesRepository.claimPending.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve([] as never);
        }),
    );

    const first = processor.processDeliveries();
    // A second tick fires before the first finishes (the cron interval is 30s).
    await processor.processDeliveries();

    expect(deliveriesRepository.claimPending).toHaveBeenCalledTimes(1);

    release?.();
    await first;
  });

  it("runs stale recovery every tenth tick with the recovery batch size", async () => {
    const { processor, deliveriesRepository } = buildProcessor({ deliveries: [] });

    for (let tick = 0; tick < 9; tick++) {
      await processor.processDeliveries();
    }
    expect(deliveriesRepository.recoverStaleProcessing).not.toHaveBeenCalled();

    await processor.processDeliveries();

    expect(deliveriesRepository.recoverStaleProcessing).toHaveBeenCalledTimes(1);
    expect(deliveriesRepository.recoverStaleProcessing).toHaveBeenCalledWith(5);

    // The counter resets, so recovery does not run on the next tick.
    await processor.processDeliveries();
    expect(deliveriesRepository.recoverStaleProcessing).toHaveBeenCalledTimes(1);
  });

  it("logs recovered stale deliveries without failing the tick", async () => {
    const { processor, deliveriesRepository, logger } = buildProcessor({ deliveries: [] });
    deliveriesRepository.recoverStaleProcessing.mockResolvedValue([{ id: "d-1" }] as never);

    for (let tick = 0; tick < 10; tick++) {
      await processor.processDeliveries();
    }

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Recovered 1 stale delivery"));
  });

  it("keeps processing the batch when stale recovery itself throws", async () => {
    const { processor, deliveriesRepository, logger } = buildProcessor();
    deliveriesRepository.recoverStaleProcessing.mockRejectedValue(new Error("recovery down"));

    for (let tick = 0; tick < 9; tick++) {
      await processor.processDeliveries();
    }
    deliveriesRepository.claimPending.mockClear();
    await processor.processDeliveries();

    expect(logger.error).toHaveBeenCalledWith(
      "Stale delivery recovery failed",
      expect.objectContaining({ error: "recovery down" }),
    );
    // A broken recovery pass must not stop deliveries from being claimed.
    expect(deliveriesRepository.claimPending).toHaveBeenCalledTimes(1);
  });
});

describe("NotificationDeliveryProcessor failure reporting", () => {
  it("reports a batch failure and releases the in-flight guard", async () => {
    const { processor, deliveriesRepository, logger, errorReporter } = buildProcessor();
    const failure = new Error("claim failed");
    deliveriesRepository.claimPending
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce([] as never);

    await processor.processDeliveries();

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to process delivery batch",
      expect.objectContaining({ error: "claim failed" }),
    );
    expect(errorReporter.reportException).toHaveBeenCalledWith(failure, {
      errorCode: "DELIVERY_PROCESSING_FAILED",
      tags: { job: "notification-delivery-processor" },
    });

    // The guard is cleared in `finally`, so the next tick still runs.
    await processor.processDeliveries();
    expect(deliveriesRepository.claimPending).toHaveBeenCalledTimes(2);
  });

  it("reports a non-Error rejection as a message", async () => {
    const { processor, deliveriesRepository, errorReporter } = buildProcessor();
    deliveriesRepository.claimPending.mockRejectedValueOnce("boom");

    await processor.processDeliveries();

    expect(errorReporter.reportMessage).toHaveBeenCalledWith("Failed to process delivery batch", {
      errorCode: "DELIVERY_PROCESSING_FAILED",
      tags: { job: "notification-delivery-processor" },
    });
    expect(errorReporter.reportException).not.toHaveBeenCalled();
  });
});
