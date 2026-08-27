import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  ERROR_CODES,
  requireOrganizationId,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
  type TransactionPort,
} from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import type { CreateExportCommand } from "../exports.types";

import { ImportExportAdapterRegistry } from "../../../infrastructure/import-export-adapter.registry";
import { ExportsMapper } from "../exports.mapper";
import {
  EXPORT_JOBS_REPOSITORY,
  type ExportJobsRepositoryPort,
} from "../ports/export-jobs.repository.port";
import { GetExportUseCase } from "./get-export.use-case";

@Injectable()
export class CreateExportUseCase {
  constructor(
    @Inject(EXPORT_JOBS_REPOSITORY)
    private readonly exportJobsRepository: ExportJobsRepositoryPort,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    private readonly getExportUseCase: GetExportUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateExportCommand,
    requestContext?: RequestContext,
  ) {
    const organizationId = requireOrganizationId(actor);

    // Resolve adapter before creating any DB records
    this.importExportAdapters.resolve(input.type);

    const exportPermissions = this.importExportAdapters.getExportPermissions(input.type);
    for (const permission of exportPermissions) {
      if (!actor.permissions.includes(permission)) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          `Missing required permission: ${permission}`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const jobValues = {
      organizationId,
      type: input.type,
      status: "PENDING" as const,
      filters: input.filters ?? null,
      createdById: actor.userId,
    };

    const { job, created } = await this.transactionPort.withTenant(
      { tenantId: organizationId, userId: actor.userId },
      async (tx) => {
        const idempotentResult = input.idempotencyKey
          ? await this.exportJobsRepository.createIdempotent(
              {
                ...jobValues,
                idempotencyKey: input.idempotencyKey,
              },
              tx,
            )
          : null;

        const jobRecord = idempotentResult
          ? idempotentResult.value
          : await this.exportJobsRepository.create(jobValues, tx);

        if (!jobRecord) {
          throw new Error("Export job insert returned no rows");
        }

        const isCreated = idempotentResult ? idempotentResult.created : true;

        if (isCreated) {
          await this.auditWriter.log(
            {
              actorId: actor.userId,
              action: "export.created",
              entityType: "export_job",
              entityId: jobRecord.id,
              metadata: {
                type: input.type,
                ...(input.filters ? { filters: input.filters } : {}),
              },
              requestContext,
              scope: SYSTEM_SCOPE.ORGANIZATION,
              organizationId,
            },
            tx,
          );
        }

        return { job: jobRecord, created: isCreated };
      },
    );

    if (!created) {
      return this.getExportUseCase.execute(actor, job.id);
    }

    // The actual export (CSV generation + upload) runs asynchronously in
    // ExportJobsProcessor; the client polls GET /exports/:id until the job
    // reaches COMPLETED and exposes a downloadable fileId.
    return ExportsMapper.toDto(job);
  }
}
