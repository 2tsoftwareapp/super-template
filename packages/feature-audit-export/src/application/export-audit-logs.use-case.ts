import type {
  AuthenticatedRequestUser,
  RequestContext,
  TransactionExecutor,
} from "@repo/api-kernel";
import type { PlatformTransactionPort, TransactionPort } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import {
  APP_LOGGER,
  PLATFORM_TRANSACTION_PORT,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
} from "@repo/api-kernel";
import type { AppLogger } from "@repo/api-kernel";
import { requireOrganizationId, toCsv } from "@repo/api-kernel";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import {
  AUDIT_REPOSITORY,
  AUDIT_WRITER,
  type AuditLogRecord,
  type AuditRepositoryPort,
  type AuditWriter,
  type ExportAuditLogsQuery,
} from "@repo/feature-audit/contracts";
import {
  FILE_VISIBILITY,
  FILES_REPOSITORY,
  type FilesRepositoryPort,
} from "@repo/feature-upload/contracts";
import {
  OBJECT_STORAGE,
  STORAGE_TRACKING_PORT,
  type ObjectStorage,
  type StorageTrackingPort,
} from "@repo/feature-upload/contracts";
import { randomUUID } from "node:crypto";

import { AUDIT_EXPORT_FILE_KIND } from "../domain/audit-export-access.policy";

const CSV_HEADER = [
  "id",
  "actorId",
  "action",
  "entityType",
  "entityId",
  "metadata",
  "ipAddress",
  "requestId",
  "createdAt",
];

// Safety bound on a single synchronous export; large historical exports should
// be paginated by date range rather than asking for everything at once.
const MAX_EXPORT_ROWS = 5000;

@Injectable()
export class ExportAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(PLATFORM_TRANSACTION_PORT)
    private readonly platformTransactionPort: PlatformTransactionPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(STORAGE_TRACKING_PORT) private readonly storageTracking: StorageTrackingPort,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    query: ExportAuditLogsQuery,
    requestContext?: RequestContext,
  ): Promise<{ fileId: string; rowCount: number; totalMatching: number; truncated: boolean }> {
    const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    // SUPER_ADMIN always exports the full trail (including platform-scoped rows
    // recorded without an organization); non-super admins stay scoped to their
    // organization.
    const organizationId = isSuperAdmin ? null : requireOrganizationId(actor);

    const fullQuery = {
      ...query,
      ...(typeof organizationId === "string" ? { organizationId } : {}),
    };

    const runInTx = <T>(fn: (tx: TransactionExecutor) => Promise<T>) => {
      if (organizationId === null) {
        return this.platformTransactionPort.run(fn);
      }
      return this.transactionPort.withTenant(
        { tenantId: organizationId, userId: actor.userId },
        fn,
      );
    };

    const { rows, totalMatching } = await runInTx(async (tx) => {
      const [rowsResult, totalResult] = await Promise.all([
        this.auditRepository.listForExport(
          {
            ...fullQuery,
            limit: MAX_EXPORT_ROWS,
          },
          tx,
        ),
        this.auditRepository.count(fullQuery, tx),
      ]);
      return { rows: rowsResult, totalMatching: totalResult };
    });

    const truncated = totalMatching > MAX_EXPORT_ROWS;

    const csv = toCsv(
      CSV_HEADER,
      rows.map((row: AuditLogRecord) => [
        row.id,
        row.actorId ?? "",
        row.action,
        row.entityType,
        row.entityId ?? "",
        row.metadata ? JSON.stringify(row.metadata) : "",
        row.ipAddress ?? "",
        row.requestId ?? "",
        row.createdAt.toISOString(),
      ]),
    );

    const storageKey = `exports/audit/${randomUUID()}.csv`;
    const body = Buffer.from(csv, "utf8");

    await this.objectStorage.upload({
      key: storageKey,
      body,
      mimeType: "text/csv",
    });

    try {
      const result = await runInTx(async (tx) => {
        const createPayload = {
          organizationId,
          storageKey,
          originalName: `audit-logs-export-${Date.now()}.csv`,
          mimeType: "text/csv",
          sizeBytes: body.length,
          uploadedById: actor.userId,
          kind: AUDIT_EXPORT_FILE_KIND,
          visibility: FILE_VISIBILITY.RESTRICTED,
        };

        const file = await this.filesRepository.create(createPayload, tx);
        if (!file) {
          throw new Error("Audit export file insert returned no rows");
        }

        await this.auditWriter.log(
          {
            ...(organizationId
              ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId }
              : { scope: SYSTEM_SCOPE.PLATFORM }),
            actorId: actor.userId,
            action: "audit.exported",
            entityType: "audit_log",
            metadata: { rowCount: rows.length, fileId: file.id, filters: { ...query } },
            requestContext,
          },
          tx,
        );

        return { fileId: file.id, rowCount: rows.length, totalMatching, truncated };
      });
      return result;
    } catch (error) {
      await this.compensateOrphanedExport(storageKey);
      throw error;
    }
  }

  /**
   * Compensation for an export whose file row never persisted: the uploaded
   * object would otherwise be orphaned. Delete it now; if that fails too,
   * record a delete retry in the storage-delete outbox so the upload feature's
   * cleanup worker owns the retry instead of the object being stranded
   * silently. (A crash before this point is covered separately: the tracked
   * OBJECT_STORAGE records every upload in the storage_objects ledger and the
   * hourly sweep deletes UPLOADED rows no live file references.)
   */
  private async compensateOrphanedExport(storageKey: string): Promise<void> {
    try {
      await this.objectStorage.delete(storageKey);
      return;
    } catch (deleteError) {
      this.logger.error(`Failed to delete orphaned audit-export object ${storageKey}`, {
        error: deleteError instanceof Error ? deleteError.message : String(deleteError),
      });
    }

    try {
      await this.storageTracking.enqueueDelete(storageKey);
    } catch (enqueueError) {
      this.logger.error(
        `Failed to enqueue delete retry for orphaned audit-export object ${storageKey}`,
        {
          error: enqueueError instanceof Error ? enqueueError.message : String(enqueueError),
        },
      );
    }
  }
}
