import type { TransactionExecutor } from '@repo/api-core';
import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { storageDeleteOutbox, storageObjects } from '@repo/api-database';
import { eq, sql } from 'drizzle-orm';

import type {
  PendingDeleteRecord,
  StorageTrackingPort,
} from '../application/ports/storage-tracking.port';

@Injectable()
export class StorageTrackingRepository implements StorageTrackingPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  /** Record that an object was uploaded (no-op if already tracked). */
  async recordUpload(
    storageKey: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    await db
      .insert(storageObjects)
      .values({ storageKey, status: 'UPLOADED' })
      .onConflictDoNothing();
  }

  /** Mark an object as confirmed deleted. */
  async recordDelete(
    storageKey: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    await db
      .update(storageObjects)
      .set({ status: 'DELETED', updatedAt: new Date() })
      .where(eq(storageObjects.storageKey, storageKey));
  }

  /**
   * Enqueue a delete retry. Upserts by storage key and resets the row to
   * PENDING without resetting the attempt counter, so repeated transient
   * failures keep their backoff progress.
   */
  async enqueueDelete(
    storageKey: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    await db
      .insert(storageDeleteOutbox)
      .values({ storageKey })
      .onConflictDoUpdate({
        target: storageDeleteOutbox.storageKey,
        set: { status: 'PENDING', updatedAt: new Date() },
      });
  }

  /**
   * Find objects still marked UPLOADED past the grace cutoff that no live file
   * or file version references. MUST run with RLS bypass (platform
   * transaction): the reference checks read the tenant-isolated `files` /
   * `file_versions` tables across all organizations.
   */
  async listOrphans(
    cutoff: Date,
    limit: number,
    executor: TransactionExecutor,
  ): Promise<string[]> {
    const db = executor as DatabaseExecutor;
    const rows = await db.execute<{ storageKey: string }>(sql`
      SELECT so.storage_key AS "storageKey"
      FROM storage_objects so
      WHERE so.status = 'UPLOADED'
        AND so.updated_at < ${cutoff}
        AND NOT EXISTS (
          SELECT 1 FROM files f
          WHERE f.storage_key = so.storage_key AND f.deleted_at IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM file_versions fv
          JOIN files f ON f.id = fv.file_id
          WHERE fv.storage_key = so.storage_key AND f.deleted_at IS NULL
        )
      ORDER BY so.updated_at ASC
      LIMIT ${limit}
    `);

    return (rows.rows ?? []).map((row) => row.storageKey);
  }

  /**
   * Atomically claim pending delete retries. Single UPDATE ... SKIP LOCKED so
   * concurrent workers each take distinct rows.
   */
  async claimPendingDeletes(
    limit: number,
    executor?: TransactionExecutor,
  ): Promise<PendingDeleteRecord[]> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const claimed = await db.execute<{
      id: string;
      storageKey: string;
      attempts: number;
      maxAttempts: number;
    }>(sql`
      UPDATE storage_delete_outbox
      SET updated_at = now()
      WHERE id IN (
        SELECT id FROM storage_delete_outbox
        WHERE status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, storage_key AS "storageKey", attempts, max_attempts AS "maxAttempts"
    `);

    return claimed.rows ?? [];
  }

  async markDeleteDone(
    id: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    await db
      .update(storageDeleteOutbox)
      .set({ status: 'DONE', errorMessage: null, updatedAt: new Date() })
      .where(eq(storageDeleteOutbox.id, id));
  }

  async markDeleteFailed(
    id: string,
    errorMessage: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    await db
      .update(storageDeleteOutbox)
      .set({
        status: sql`CASE WHEN attempts + 1 >= max_attempts THEN 'FAILED' ELSE 'PENDING' END`,
        attempts: sql`attempts + 1`,
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(storageDeleteOutbox.id, id));
  }
}
