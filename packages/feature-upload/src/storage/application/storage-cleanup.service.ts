import type { AppLogger, PlatformTransactionPort } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { APP_LOGGER, PLATFORM_TRANSACTION_PORT } from "@repo/api-kernel";
import { ErrorReporterService } from "@repo/api-runtime";

import type { ObjectStorage } from "./ports/object-storage.interface";

import { OBJECT_STORAGE } from "./ports/object-storage.interface";
import { STORAGE_TRACKING_PORT, type StorageTrackingPort } from "./ports/storage-tracking.port";

const ORPHAN_GRACE_MS = 60 * 60 * 1000; // object untouched for 1h is a candidate
const ORPHAN_BATCH_SIZE = 50;
const DELETE_BATCH_SIZE = 50;
/** Hard ceiling per invocation: a cron run must finish even if new orphans keep appearing. */
const MAX_SWEEP_ROUNDS = 20;

/**
 * Periodically closes every orphan/stuck storage lifecycle:
 *
 * 1. Sweep: objects in storage_objects still 'UPLOADED' past the grace period
 *    with no live file/version reference (crash between upload and DB insert,
 *    or a delete that never happened) → delete from storage, mark DELETED.
 * 2. Delete outbox: retry PENDING deletes recorded by the tracking wrapper
 *    when a storage delete failed; terminal FAILED after max attempts.
 *
 * Both phases run inside a platform transaction (RLS bypass) so the reference
 * checks and outbox claims see rows across all organizations. Storage deletes
 * themselves are external calls made outside that transaction.
 */
@Injectable()
export class StorageCleanupService {
  private processing = false;

  constructor(
    @Inject(STORAGE_TRACKING_PORT) private readonly tracking: StorageTrackingPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    @Inject(PLATFORM_TRANSACTION_PORT)
    private readonly platformTransactionPort: PlatformTransactionPort,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    private readonly errorReporter: ErrorReporterService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runCleanup(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      await this.sweepOrphans();
      await this.processDeleteOutbox();
    } catch (error) {
      const logContext: Record<string, string> = {
        error: error instanceof Error ? error.message : String(error),
      };
      if (error instanceof Error && error.stack) {
        logContext.stack = error.stack;
      }
      this.logger.error("Storage cleanup failed", logContext);
      if (error instanceof Error) {
        this.errorReporter.reportException(error, {
          errorCode: "STORAGE_CLEANUP_FAILED",
          tags: { job: "storage-cleanup" },
        });
      } else {
        this.errorReporter.reportMessage("Storage cleanup failed", {
          errorCode: "STORAGE_CLEANUP_FAILED",
          tags: { job: "storage-cleanup" },
        });
      }
    } finally {
      this.processing = false;
    }
  }

  private async sweepOrphans(): Promise<void> {
    const cutoff = new Date(Date.now() - ORPHAN_GRACE_MS);
    const attempted = new Set<string>();
    let swept = 0;
    let deferred = 0;
    let rounds = 0;

    // The sweep is progress-driven, not state-driven: a failed delete leaves the
    // row UPLOADED, so re-querying without remembering attempted keys would
    // spin forever on the same batch. Failures are retried by the outbox.
    while (rounds < MAX_SWEEP_ROUNDS) {
      rounds += 1;

      const orphans = await this.platformTransactionPort.run((tx) =>
        this.tracking.listOrphans(cutoff, ORPHAN_BATCH_SIZE, tx),
      );

      const batch = orphans.filter((storageKey) => !attempted.has(storageKey));

      if (batch.length === 0) {
        break;
      }

      let deletedInRound = 0;

      for (const storageKey of batch) {
        attempted.add(storageKey);

        try {
          // Uses the tracked delete: success marks DELETED, failure enqueues a
          // retry in the outbox handled by processDeleteOutbox.
          await this.objectStorage.delete(storageKey);
          swept += 1;
          deletedInRound += 1;
        } catch {
          // Handled via the outbox; keep sweeping the rest.
          deferred += 1;
        }
      }

      if (deletedInRound === 0) {
        break;
      }
    }

    if (deferred > 0) {
      this.logger.warn(
        `Storage cleanup deferred ${deferred} orphaned object(s) to the delete outbox`,
      );
    }

    if (swept > 0) {
      this.logger.warn(`Storage cleanup swept ${swept} orphaned object(s)`);
    }
  }

  private async processDeleteOutbox(): Promise<void> {
    for (;;) {
      const pending = await this.platformTransactionPort.run((tx) =>
        this.tracking.claimPendingDeletes(DELETE_BATCH_SIZE, tx),
      );

      if (pending.length === 0) {
        break;
      }

      for (const item of pending) {
        try {
          await this.objectStorage.delete(item.storageKey);
          await this.tracking.markDeleteDone(item.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await this.tracking.markDeleteFailed(item.id, message);
          if (item.attempts + 1 >= item.maxAttempts) {
            this.logger.error(`Storage delete for ${item.storageKey} exhausted retries`, {
              error: message,
            });
          }
        }
      }
    }
  }
}
