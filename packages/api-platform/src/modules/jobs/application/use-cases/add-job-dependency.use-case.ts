import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';
import { sql } from 'drizzle-orm';

import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';
import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
  type JobScope,
} from '../ports/jobs.repository.port';
import { TRANSACTION_PORT, type TransactionPort, WORKER_DISPATCH_CONTEXT, type TransactionExecutor } from '@repo/api-core';

@Injectable()
export class AddJobDependencyUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(jobId: string, dependsOnJobId: string, scope?: JobScope) {
    if (jobId === dependsOnJobId) {
      throw new AppError(
        ERROR_CODES.JOB_DEPENDENCY_CYCLE,
        'A job cannot depend on itself',
        HttpStatus.CONFLICT,
      );
    }

    const [job, dependsOnJob] = await Promise.all([
      this.jobsRepository.findById(jobId, scope),
      this.jobsRepository.findById(dependsOnJobId, scope),
    ]);

    if (!job || !dependsOnJob) {
      throw new AppError(
        ERROR_CODES.JOB_NOT_FOUND,
        'Job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // T-008: Same-scope validation
    if (job.organizationId !== dependsOnJob.organizationId) {
      throw new AppError(
        ERROR_CODES.JOB_DEPENDENCY_CYCLE,
        'Cannot create dependency across different scopes',
        HttpStatus.CONFLICT,
      );
    }

    // T-008: Atomic cycle check using advisory lock
    const wouldCycle = await this.transactionPort.withTenant(
      WORKER_DISPATCH_CONTEXT,
      async (tx: TransactionExecutor) => {
        await (tx as any).execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`dep-${jobId}-${dependsOnJobId}`}))`);
        return this.jobObservabilityRepository.wouldCreateCycle(
          jobId,
          dependsOnJobId,
          tx,
        );
      },
    );

    if (wouldCycle) {
      throw new AppError(
        ERROR_CODES.JOB_DEPENDENCY_CYCLE,
        'Adding this dependency would create a cycle',
        HttpStatus.CONFLICT,
      );
    }

    const dependency = await this.jobObservabilityRepository.addDependency({
      jobId,
      organizationId: job.organizationId ?? null,
      dependsOnJobId,
    });

    return {
      id: dependency.id,
      dependsOnJobId: dependency.dependsOnJobId,
      dependsOnJobStatus: dependsOnJob.status,
      createdAt: dependency.createdAt.toISOString(),
    };
  }
}