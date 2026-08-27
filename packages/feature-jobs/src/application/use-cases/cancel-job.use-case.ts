import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ERROR_CODES } from "@repo/api-runtime";
import {
  AppError,
  TRANSACTION_PORT,
  type TransactionExecutor,
  type TransactionPort,
  WORKER_DISPATCH_CONTEXT,
} from "@repo/api-runtime";
import { JOB_ERROR_CODES } from "@repo/feature-jobs/contracts";

import type { JobView } from "../jobs.types";

import { JobsMapper } from "../jobs.mapper";
import {
  JOB_OBSERVABILITY_REPOSITORY,
  type JobObservabilityRepositoryPort,
} from "../ports/job-observability.repository.port";
import {
  JOBS_REPOSITORY,
  type JobScope,
  type JobsRepositoryPort,
} from "../ports/jobs.repository.port";
import { PropagationService } from "../services/propagation.service";

@Injectable()
export class CancelJobUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY)
    private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    private readonly jobsMapper: JobsMapper,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    private readonly propagationService: PropagationService,
  ) {}

  async execute(actor: AuthenticatedRequestUser, jobId: string): Promise<JobView> {
    const scope = this.buildScope(actor);

    const cancelled = await this.transactionPort.withTenant(
      WORKER_DISPATCH_CONTEXT,
      async (tx: TransactionExecutor) => {
        const result = await this.jobsRepository.markCancelled(jobId, scope, tx);
        if (!result) return null;
        await this.jobObservabilityRepository.recordEvent(
          {
            jobId: result.id,
            organizationId: result.organizationId ?? null,
            type: "cancelled",
            message: `Cancelled by user ${actor.userId}`,
          },
          tx,
        );
        await this.propagationService.propagateBlocked(
          jobId,
          scope,
          result.organizationId ?? null,
          "cancelled",
          tx,
        );
        return result;
      },
    );

    if (!cancelled) {
      const existing = await this.jobsRepository.findById(jobId, scope);

      if (!existing) {
        throw new AppError(JOB_ERROR_CODES.JOB_NOT_FOUND, "Job not found", HttpStatus.NOT_FOUND);
      }

      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        "Only pending jobs can be cancelled",
        HttpStatus.CONFLICT,
      );
    }

    return this.jobsMapper.toJobView(cancelled);
  }

  private buildScope(actor: AuthenticatedRequestUser): JobScope {
    return actor.organizationId
      ? { type: "organization", organizationId: actor.organizationId }
      : { type: "platform" };
  }
}
