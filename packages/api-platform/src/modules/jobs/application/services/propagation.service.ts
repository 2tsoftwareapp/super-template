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

        let marked = false;
        if (needsBlock) {
          try {
            // withSavepoint returns the callback result. If recordEvent
            // throws inside, the savepoint rolls back and the error is
            // rethrown — marked stays false (H-002).
            marked = await this.transactionPort.withSavepoint<boolean>(
              executor,
              `propagate_${dep.jobId}`,
              async () => {
                const blocked = await this.jobsRepository.markBlocked(dep.jobId, scope, `Dependency ${currentId} ${message}`, executor);
                if (!blocked) {
                  return false;
                }
                await this.jobObservabilityRepository.recordEvent(
                  { jobId: dep.jobId, organizationId, type: 'dependency_failed', message: `Dependency ${currentId} ${message}` },
                  executor,
                );
                return true;
              },
            );
          } catch (error) {
            // Savepoint rolled back — markBlocked did not take effect.
            // Log outside the savepoint but swallow on failure so the outer
            // transaction (cancel/markFailed/stale-recovery batch) is not affected.
            const detail = error instanceof Error ? error.message : 'Unknown blocking error';
            try {
              await this.jobObservabilityRepository.recordEvent(
                { jobId: dep.jobId, organizationId, type: 'dependency_failed', message: `Blocked propagation isolated: ${detail}` },
                executor,
              );
            } catch {
              // Observability failure must not roll back outer transaction.
            }
          }
        }

        // Only queue for descendant traversal when:
        // - The node was already BLOCKED/FAILED/CANCELLED (needsBlock = false);
        //   descendants still need visiting if a prior BFS crashed mid-graph.
        // - markBlocked just succeeded (marked = true).
        // If needsBlock is true and marked is false (markBlocked returned null
        // or savepoint rolled back), the node is still PENDING/PROCESSING and
        // its descendants must not be BLOCKED (H-002).
        if (!needsBlock || marked) {
          queue.push(dep.jobId);
        }
      }
    }
  }
}
