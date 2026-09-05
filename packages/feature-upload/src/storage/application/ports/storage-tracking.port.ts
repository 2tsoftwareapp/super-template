import type { TransactionExecutor } from "@repo/api-kernel";

export interface PendingDeleteRecord {
  id: string;
  storageKey: string;
  attempts: number;
  maxAttempts: number;
}

export interface StorageTrackingPort {
  /** Record that an object was uploaded (no-op if already tracked). */
  recordUpload(storageKey: string, executor?: TransactionExecutor): Promise<void>;

  /** Mark an object as confirmed deleted. */
  recordDelete(storageKey: string, executor?: TransactionExecutor): Promise<void>;

  /** Enqueue a delete retry (upsert by storage key, keeps attempt progress). */
  enqueueDelete(storageKey: string, executor?: TransactionExecutor): Promise<void>;

  /**
   * Objects still UPLOADED past the cutoff with no live file/version reference.
   * Must run with RLS bypass (platform transaction).
   */
  listOrphans(cutoff: Date, limit: number, executor: TransactionExecutor): Promise<string[]>;

  /** Atomically claim pending delete retries (FOR UPDATE SKIP LOCKED). */
  claimPendingDeletes(
    limit: number,
    executor?: TransactionExecutor,
  ): Promise<PendingDeleteRecord[]>;

  markDeleteDone(id: string, executor?: TransactionExecutor): Promise<void>;

  markDeleteFailed(id: string, errorMessage: string, executor?: TransactionExecutor): Promise<void>;
}

export const STORAGE_TRACKING_PORT = Symbol("STORAGE_TRACKING_PORT");
