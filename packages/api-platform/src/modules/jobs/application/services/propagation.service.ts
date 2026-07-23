import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTION_PORT, type TransactionPort, type TransactionExecutor } from '@repo/api-core';

import { isTerminalStatus, isBlockingStatus } from '../../domain/job-lifecycle';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';
import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
  type JobScope,
} from '../ports/jobs.repository.port';

@Injectable()
export class PropagationService {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  async propagateBlocked(
    jobId: string,
    scope: JobScope,
    organizationId: string | null,
    message: string,
    executor: TransactionExecutor,
  ): Promise<void> {
    const visited = new Set<string>();
    const queue = [jobId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      const dependents = await this.jobsRepository.listDependents(currentId, scope, executor);
      for (const dep of dependents) {
        if (isTerminalStatus(dep.status) || isBlockingStatus(dep.status)) {
          continue;
        }
        await this.transactionPort.withSavepoint(
          executor,
          `propagate_${dep.jobId}`,
          async () => {
            const blocked = await this.jobsRepository.markBlocked(dep.jobId, scope, `Dependency ${currentId} ${message}`, executor);
            if (!blocked) {
              return;
            }
            await this.jobObservabilityRepository.recordEvent(
              { jobId: dep.jobId, organizationId, type: 'dependency_failed', message: `Dependency ${currentId} ${message}` },
              executor,
            );
          },
        );
        queue.push(dep.jobId);
      }
    }
  }
}
