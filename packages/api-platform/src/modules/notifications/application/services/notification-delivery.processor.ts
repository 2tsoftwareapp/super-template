import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  ADVISORY_LOCK_PORT,
  type AdvisoryLockPort,
  APP_LOGGER,
  type AppLogger,
  ErrorReporterService,
  TenantContextService,
  WORKER_DISPATCH_CONTEXT,
} from "@repo/api-core";

import type { PushMessage, PushNotifier } from "../ports/push.interface";

import { MAX_DELIVERY_RETRY_ATTEMPTS } from "../../domain/delivery-policy";
import { tokenLockId } from "../../domain/token-lock";
import {
  DELIVERIES_REPOSITORY,
  type DeliveriesRepositoryPort,
} from "../ports/deliveries.repository.port";
import {
  DEVICE_TOKENS_REPOSITORY,
  type DeviceTokensRepositoryPort,
} from "../ports/device-tokens.repository.port";
import {
  type NotificationRecord,
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from "../ports/notifications.repository.port";
import { PUSH_NOTIFIER } from "../ports/push.interface";

const DELIVERY_BATCH_SIZE = 50;
const RECOVERY_INTERVAL = 10; // Run stale recovery every Nth tick (~5min at 30s interval)

@Injectable()
export class NotificationDeliveryProcessor {
  private processing = false;
  private tickCount = 0;

  constructor(
    @Inject(DELIVERIES_REPOSITORY)
    private readonly deliveriesRepository: DeliveriesRepositoryPort,
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepositoryPort,
    @Inject(DEVICE_TOKENS_REPOSITORY)
    private readonly deviceTokensRepository: DeviceTokensRepositoryPort,
    @Inject(PUSH_NOTIFIER)
    private readonly pushNotifier: PushNotifier,
    @Inject(ADVISORY_LOCK_PORT)
    private readonly advisoryLock: AdvisoryLockPort,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    private readonly errorReporter: ErrorReporterService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processDeliveries() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      await this.tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT, async () => {
        // Periodically recover stale PROCESSING deliveries
        this.tickCount++;
        if (this.tickCount >= RECOVERY_INTERVAL) {
          this.tickCount = 0;
          try {
            const recovered = await this.deliveriesRepository.recoverStaleProcessing(5);
            if (recovered.length > 0) {
              this.logger.warn(`Recovered ${recovered.length} stale delivery(ies) from PROCESSING`);
            }
          } catch (recoveryError) {
            this.logger.error("Stale delivery recovery failed", {
              error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
            });
          }
        }

        const deliveries = await this.deliveriesRepository.claimPending(DELIVERY_BATCH_SIZE);

        if (deliveries.length === 0) {
          return;
        }

        const notificationIds = [...new Set(deliveries.map((d) => d.notificationId))];
        const tokenIds = [...new Set(deliveries.map((d) => d.deviceTokenId))];

        const [notificationResults, tokens] = await Promise.all([
          Promise.all(notificationIds.map((id) => this.notificationsRepository.findById(id))),
          this.deviceTokensRepository.listByIds(tokenIds),
        ]);

        const notificationMap = new Map(
          notificationResults.filter(Boolean).map((n) => [n!.id, n!]),
        );
        const tokenMap = new Map(tokens.map((t) => [t.id, t]));

        for (const delivery of deliveries) {
          await this.processOneDelivery(delivery, notificationMap, tokenMap);
        }
      });
    } catch (error) {
      const logContext: Record<string, string> = {
        error: error instanceof Error ? error.message : String(error),
      };
      if (error instanceof Error && error.stack) {
        logContext.stack = error.stack;
      }
      this.logger.error("Failed to process delivery batch", logContext);
      if (error instanceof Error) {
        this.errorReporter.reportException(error, {
          errorCode: "DELIVERY_PROCESSING_FAILED",
          tags: { job: "notification-delivery-processor" },
        });
      } else {
        this.errorReporter.reportMessage("Failed to process delivery batch", {
          errorCode: "DELIVERY_PROCESSING_FAILED",
          tags: { job: "notification-delivery-processor" },
        });
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single delivery with per-token advisory locking to eliminate the
   * TOCTOU race between the processor's owner-check + FCM send and a concurrent
   * registerOrTransfer() call on the same token.
   *
   * Serialization contract (shared with DeviceTokensRepository.registerOrTransfer):
   *   Both paths acquire pg_try_advisory_lock(tokenLockId(token)) before
   *   mutating ownership or sending FCM. If the lock cannot be acquired
   *   immediately the delivery is left in PROCESSING and will be recovered
   *   by the stale-recovery cron.
   *
   * Flow:
   *   1. Look up notification and the device-token row by the IDs captured at
   *      claim time — if either is gone, fail the delivery.
   *   2. Acquire per-token advisory lock. If unavailable (transfer in progress),
   *      skip and let stale recovery retry the delivery later.
   *   3. Re-read the active token from DB inside the lock to get the latest
   *      ownership state (the pre-claim tokenMap is stale after a transfer).
   *   4. Verify notification.userId === freshToken.userId; fail if mismatch.
   *   5. Send to FCM.
   *   6. markSentIfProcessing — conditional so a racing transfer that already
   *      set the row to FAILED cannot be overwritten.
   *   7. Release lock.
   */
  private async processOneDelivery(
    delivery: { id: string; notificationId: string; deviceTokenId: string; attempts: number },
    notificationMap: Map<string, NotificationRecord>,
    tokenMap: Map<string, { id: string; userId: string; token: string }>,
  ) {
    const notification = notificationMap.get(delivery.notificationId);
    const preClaimToken = tokenMap.get(delivery.deviceTokenId);

    if (!notification || !preClaimToken) {
      await this.deliveriesRepository.markFailed(
        delivery.id,
        "Missing notification or device token",
      );
      return;
    }

    // Acquire the per-token lock. Returns null immediately if another session
    // holds it (i.e. registerOrTransfer is running concurrently for this token).
    const lockResult = await this.advisoryLock.withAdvisoryLock(
      tokenLockId(preClaimToken.token),
      async () => {
        // Step 3: Re-read the active token inside the lock — ownership may have
        // changed between claimPending and now.
        const freshToken = await this.deviceTokensRepository.listActiveByToken(preClaimToken.token);

        // Token was disabled (e.g. transferred) before we acquired the lock.
        if (!freshToken) {
          await this.deliveriesRepository.markFailed(
            delivery.id,
            "Device token was deactivated before send",
          );
          return "skipped";
        }

        // Step 4: Re-verify ownership with the fresh row.
        if (notification.userId !== freshToken.userId) {
          await this.deliveriesRepository.markFailed(
            delivery.id,
            "Notification owner does not match device token owner after re-check",
          );
          return "skipped";
        }

        const message: PushMessage = {
          notificationId: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        };

        // Step 5: Send to FCM while holding the lock.
        const result = await this.pushNotifier.sendToToken(freshToken.token, message);

        if (result.success) {
          // Step 6: Conditional update — no-op if transfer already invalidated the row.
          const sent = await this.deliveriesRepository.markSentIfProcessing(
            delivery.id,
            result.providerMessageId,
          );
          if (!sent) {
            this.logger.warn(
              `Delivery ${delivery.id} was superseded by token transfer; FCM send discarded`,
            );
          }
        } else if (result.error === "INVALID_TOKEN") {
          await this.deviceTokensRepository.disableTokens(
            [freshToken.token],
            "FCM returned INVALID_TOKEN",
          );
          await this.deliveriesRepository.markFailed(delivery.id, "Invalid device token");
          this.logger.warn(`Disabled invalid token for delivery ${delivery.id}`);
        } else if (delivery.attempts >= MAX_DELIVERY_RETRY_ATTEMPTS) {
          await this.deliveriesRepository.markFailed(
            delivery.id,
            `Max retries exceeded: ${result.error}`,
          );
        } else {
          const backoffMinutes = Math.pow(2, delivery.attempts - 1);
          const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
          await this.deliveriesRepository.markRetryable(delivery.id, nextAttemptAt);
          this.logger.warn(
            `Delivery ${delivery.id} will retry in ${backoffMinutes}min (attempt ${delivery.attempts}/${MAX_DELIVERY_RETRY_ATTEMPTS}): ${result.error}`,
          );
        }

        return "processed";
      },
    );

    // lockResult === null means lock was not acquired — leave delivery in PROCESSING
    // so the stale-recovery cron resets it to PENDING on the next cycle.
    if (lockResult === null) {
      this.logger.warn(
        `Could not acquire token lock for delivery ${delivery.id}; will be recovered by stale-recovery`,
      );
    }
  }
}
