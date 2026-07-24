import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTION_PORT, type TransactionExecutor, type TransactionPort } from '@repo/api-core';

import { isBlockingStatus, isTerminalStatus } from '../../domain/job-lifecycle';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';
import {
  JOBS_REPOSITORY,
  type JobScope,
  type JobsRepositoryPort,
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
        // COMPLETED jobs do not block their dependents; nothing to propagate.
        if (dep.status === 'COMPLETED') {
          continue;
        }

        // For BLOCKED/FAILED/CANCELLED: already in a terminal/blocking state,
        // no need to markBlocked again, but descendants still need traversal
        // (a previous propagation run may have crashed mid-graph — see H-002).
        // For PENDING/PROCESSING: attempt to mark BLOCKED now.
        const needsBlock = !isTerminalStatus(dep.status) && !isBlockingStatus(dep.status);

        if (needsBlock) {
          try {
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
          } catch (error) {
            const detail = error instanceof Error ? error.message : 'Unknown blocking error';
            await this.jobObservabilityRepository.recordEvent(
              { jobId: dep.jobId, organizationId, type: 'dependency_failed', message: `Blocked propagation isolated: ${detail}` },
              executor,
            );
          }
        }

        // Always queue for descendant traversal — even if the node was already
        // terminal/blocking, its descendants may not have been visited yet if a
        // prior propagation run crashed mid-graph (H-002).
        queue.push(dep.jobId);
      }
    }
  }
}
