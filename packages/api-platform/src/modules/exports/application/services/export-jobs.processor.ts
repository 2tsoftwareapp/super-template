import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  ACTIVITY_EMITTER,
  type ActivityEmitter,
  APP_LOGGER,
  AppError,
  type AppLogger,
  ERROR_CODES,
  ErrorReporterService,
  SYSTEM_SCOPE,
  TenantContextService,
  toCsv,
  TRANSACTION_PORT,
  type TransactionPort,
} from "@repo/api-core";
import { randomUUID } from "node:crypto";

import { ImportExportAdapterRegistry } from "../../../../import-export/import-export-adapter.registry";
import { AuditService } from "../../../audit/application/audit.service";
import {
  FILES_REPOSITORY,
  type FilesRepositoryPort,
} from "../../../files/application/ports/files.repository.port";
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from "../../../storage/application/object-storage.interface";
import { MAX_EXPORT_ROWS } from "../../domain/export-policy";
import {
  EXPORT_JOBS_REPOSITORY,
  type ExportJobsRepositoryPort,
} from "../ports/export-jobs.repository.port";

const CLAIM_BATCH_SIZE = 10;

@Injectable()
export class ExportJobsProcessor {
  private processing = false;

  constructor(
    @Inject(EXPORT_JOBS_REPOSITORY)
    private readonly exportJobsRepository: ExportJobsRepositoryPort,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    private readonly tenantContextService: TenantContextService,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    private readonly errorReporter: ErrorReporterService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPendingExports(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      // Atomic claim: PENDING -> PROCESSING with FOR UPDATE SKIP LOCKED, so
      // concurrent instances each take disjoint jobs and never double-export.
      const jobs = await this.exportJobsRepository.claimPending(CLAIM_BATCH_SIZE);

      for (const job of jobs) {
        await this.processExport(job.id);
      }
    } catch (error) {
      const logContext: Record<string, string> = {
        error: error instanceof Error ? error.message : String(error),
      };
      if (error instanceof Error && error.stack) {
        logContext.stack = error.stack;
      }
      this.logger.error("Failed to process pending export jobs", logContext);
      if (error instanceof Error) {
        this.errorReporter.reportException(error, {
          errorCode: "EXPORT_JOB_PROCESSING_FAILED",
          tags: { job: "export-jobs" },
        });
      } else {
        this.errorReporter.reportMessage("Failed to process pending export jobs", {
          errorCode: "EXPORT_JOB_PROCESSING_FAILED",
          tags: { job: "export-jobs" },
        });
      }
    } finally {
      this.processing = false;
    }
  }

  private async processExport(jobId: string): Promise<void> {
    const job = await this.exportJobsRepository.findById(jobId);

    if (job?.status !== "PROCESSING") {
      return;
    }

    if (!job.organizationId) {
      // Schema guarantees NOT NULL; defensive guard for the port's nullable type.
      throw new Error(`Export job ${job.id} has no organization`);
    }
    const organizationId = job.organizationId;

    let storageKey: string | undefined;

    try {
      const adapter = this.importExportAdapters.resolve(job.type);

      // The user who created the job is long gone (no request context), so set
      // the tenant context explicitly for the pool-backed adapter queries and
      // the completion transaction's RLS policies.
      const rows = await this.tenantContextService.runAsync(
        { tenantId: organizationId, userId: job.createdById },
        async () => {
          const fetched = await adapter.listForExport({
            organizationId,
            ownerId: job.createdById,
            limit: MAX_EXPORT_ROWS + 1,
          });

          if (fetched.length > MAX_EXPORT_ROWS) {
            throw new AppError(
              ERROR_CODES.VALIDATION_FAILED,
              `Export exceeds the maximum of ${MAX_EXPORT_ROWS} rows; narrow your filters and try again`,
            );
          }

          return fetched;
        },
      );

      const csv = toCsv(
        adapter.csvHeader,
        rows.map((row) => adapter.toCsvRow(row)),
      );
      storageKey = `exports/${job.createdById}/${randomUUID()}.csv`;
      const body = Buffer.from(csv, "utf8");

      await this.objectStorage.upload({
        key: storageKey,
        body,
        mimeType: "text/csv",
      });

      await this.transactionPort.run(async (tx) => {
        const file = await this.filesRepository.create(
          {
            organizationId,
            storageKey: storageKey!,
            originalName: `${job.type}-export-${Date.now()}.csv`,
            mimeType: "text/csv",
            sizeBytes: body.length,
            uploadedById: job.createdById,
          },
          tx,
        );

        if (!file) {
          throw new Error("Export file insert returned no rows");
        }

        await this.exportJobsRepository.update(
          job.id,
          {
            status: "COMPLETED",
            fileId: file.id,
            completedAt: new Date(),
          },
          tx,
        );

        await this.auditService.log(
          {
            actorId: job.createdById,
            action: "export.completed",
            entityType: "export_job",
            entityId: job.id,
            metadata: { type: job.type, fileId: file.id, rowCount: rows.length },
            scope: SYSTEM_SCOPE.ORGANIZATION,
            organizationId,
          },
          tx,
        );

        await this.activityEmitter.emit(
          {
            organizationId,
            summary: `Export "${job.type}" completed (${rows.length} rows)`,
            entityType: "export_job",
            entityId: job.id,
            actorId: job.createdById,
            visibility: "INTERNAL",
            metadata: { type: job.type, fileId: file.id, rowCount: rows.length },
          },
          tx,
        );
      });
    } catch {
      if (storageKey) {
        await this.objectStorage.delete(storageKey).catch((err) => {
          this.logger.error(`Failed to cleanup orphaned export object ${storageKey}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }

      await this.exportJobsRepository
        .update(job.id, {
          status: "FAILED",
          completedAt: new Date(),
        })
        .catch((err) => {
          this.logger.error(`Failed to mark export job ${job.id} as FAILED`, {
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }
  }
}
