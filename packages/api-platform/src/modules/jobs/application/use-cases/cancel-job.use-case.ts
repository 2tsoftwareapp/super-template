import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES, TRANSACTION_PORT, type TransactionPort, WORKER_DISPATCH_CONTEXT, type TransactionExecutor } from '@repo/api-core';

import type { JobView } from '../jobs.types';

import { JobsMapper } from '../jobs.mapper';
import { isTerminalStatus } from '../../domain/job-lifecycle';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';
import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
  type JobScope,
} from '../ports/jobs.repository.port';

@Injectable()
export class CancelJobUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    private readonly jobsMapper: JobsMapper,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    jobId: string,
  ): Promise<JobView> {
    const scope = this.buildScope(actor);

    const cancelled = await this.transactionPort.withTenant(
      WORKER_DISPATCH_CONTEXT,
      async (tx: TransactionExecutor) => {
        const result = await this.jobsRepository.markCancelled(jobId, scope, tx);
        if (!result) return null;
        await this.jobObservabilityRepository.recordEvent(
          { jobId: result.id, organizationId: result.organizationId ?? null, type: 'cancelled', message: `Cancelled by user ${actor.userId}` },
          tx,
        );
        await this.propagateToDependents(jobId, result.organizationId ?? null, tx);
        return result;
      },
    );

    if (!cancelled) {
      const existing = await this.jobsRepository.findById(jobId, scope);

      if (!existing) {
        throw new AppError(ERROR_CODES.JOB_NOT_FOUND, 'Job not found', HttpStatus.NOT_FOUND);
      }

      throw new AppError(ERROR_CODES.RESOURCE_CONFLICT, 'Only pending jobs can be cancelled', HttpStatus.CONFLICT);
    }

    return this.jobsMapper.toJobView(cancelled);
  }

  private async propagateToDependents(
    jobId: string,
    organizationId: string | null,
    executor: TransactionExecutor,
  ) {
    const dependents = await this.jobsRepository.listDependents(jobId, executor);
    for (const dep of dependents) {
      if (isTerminalStatus(dep.status as any)) {
        continue;
      }
      await this.jobsRepository.markBlocked(dep.jobId, `Dependency ${jobId} cancelled`, executor);
      await this.jobObservabilityRepository.recordEvent(
        { jobId: dep.jobId, organizationId, type: 'dependency_failed', message: `Dependency ${jobId} cancelled` },
        executor,
      );
    }
  }

  private buildScope(actor: AuthenticatedRequestUser): JobScope {
    return actor.organizationId
      ? { type: 'organization', organizationId: actor.organizationId }
      : { type: 'platform' };
  }
}