import { Injectable } from "@nestjs/common";

import type {
  ObjectStorage,
  UploadInput,
  UploadResult,
} from "../application/ports/object-storage.interface";

import { StorageTrackingRepository } from "./storage-tracking.repository";

/**
 * Wraps the active storage driver so every upload/delete is recorded in the
 * storage_objects ledger:
 *
 *   upload  → driver upload, then best-effort record 'UPLOADED'
 *   delete  → driver delete; on success record 'DELETED', on failure enqueue a
 *             retry in storage_delete_outbox (and rethrow, preserving the
 *             callers' existing failure handling).
 *
 * Tracking is best-effort: a ledger write failing never fails the underlying
 * storage operation. The cleanup worker uses the ledger (plus live file
 * references) to sweep orphans such as objects uploaded right before a crash.
 */
@Injectable()
export class TrackingObjectStorage implements ObjectStorage {
  constructor(
    private readonly inner: ObjectStorage,
    private readonly tracking: StorageTrackingRepository,
  ) {}

  async upload(input: UploadInput): Promise<UploadResult> {
    const result = await this.inner.upload(input);

    await this.tracking.recordUpload(input.key).catch(() => undefined);

    return result;
  }

  async read(key: string): Promise<Buffer> {
    return this.inner.read(key);
  }

  async delete(key: string): Promise<void> {
    try {
      await this.inner.delete(key);
      await this.tracking.recordDelete(key).catch(() => undefined);
    } catch (error) {
      // Preserve the failure for the caller, but record a retry intent so the
      // cleanup worker can attempt the delete again later.
      await this.tracking.enqueueDelete(key).catch(() => undefined);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    return this.inner.getSignedUrl(key, expiresInSeconds);
  }
}
