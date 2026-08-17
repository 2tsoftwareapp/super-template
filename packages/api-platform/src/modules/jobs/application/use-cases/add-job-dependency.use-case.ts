import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  ERROR_CODES,
  TRANSACTION_PORT,
  type TransactionExecutor,
  type TransactionPort,
  WORKER_DISPATCH_CONTEXT,
} from "@repo/api-core";

import {
  JOB_OBSERVABILITY_REPOSITORY,
  type JobObservabilityRepositoryPort,
} from "../ports/job-observability.repository.port";
import {
  JOBS_REPOSITORY,
  type JobScope,
  type JobsRepositoryPort,
} from "../ports/jobs.repository.port";

@Injectable()
export class AddJobDependencyUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY)
    private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(jobId: string, dependsOnJobId: string, scope: JobScope) {
    if (jobId === dependsOnJobId) {
      throw new AppError(
        ERROR_CODES.JOB_DEPENDENCY_CYCLE,
        "A job cannot depend on itself",
        HttpStatus.CONFLICT,
      );
    }

    const dependency = await this.transactionPort.withTenant(
      WORKER_DISPATCH_CONTEXT,
      async (tx: TransactionExecutor) => {
        await this.jobsRepository.acquireDependencyGraphLock(scope, tx);

        const [job, dependsOnJob] = await Promise.all([
          this.jobsRepository.findById(jobId, scope, tx),
          this.jobsRepository.findById(dependsOnJobId, scope, tx),
        ]);

        if (!job || !dependsOnJob) {
          throw new AppError(ERROR_CODES.JOB_NOT_FOUND, "Job not found", HttpStatus.NOT_FOUND);
        }

        // R2-9: Status validation
        if (job.status !== "PENDING") {
          throw new AppError(
            ERROR_CODES.JOB_DEPENDENCY_CYCLE,
            "Only pending jobs can have dependencies added",
            HttpStatus.CONFLICT,
          );
        }

        // Same-scope validation
        if (job.organizationId !== dependsOnJob.organizationId) {
          throw new AppError(
            ERROR_CODES.JOB_DEPENDENCY_CYCLE,
            "Cannot create dependency across different scopes",
            HttpStatus.CONFLICT,
          );
        }

        // Cycle check (inside same TX + lock)
        const wouldCycle = await this.jobObservabilityRepository.wouldCreateCycle(
          jobId,
          dependsOnJobId,
          tx,
        );
        if (wouldCycle) {
          throw new AppError(
            ERROR_CODES.JOB_DEPENDENCY_CYCLE,
            "Adding this dependency would create a cycle",
            HttpStatus.CONFLICT,
          );
        }

        const dep = await this.jobObservabilityRepository.addDependency(
          {
            jobId,
            organizationId: job.organizationId ?? null,
            dependsOnJobId,
          },
          tx,
        );

        return { dep, dependsOnJobStatus: dependsOnJob.status };
      },
    );

    return {
      id: dependency.dep.id,
      dependsOnJobId: dependency.dep.dependsOnJobId,
      dependsOnJobStatus: dependency.dependsOnJobStatus,
      createdAt: dependency.dep.createdAt.toISOString(),
    };
  }
}
