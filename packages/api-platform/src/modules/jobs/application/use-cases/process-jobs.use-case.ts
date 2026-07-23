import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  isJsonObject,
  redactSensitive,
  tenantContextForJob,
  TenantContextService,
  TRANSACTION_PORT,
  type TransactionPort,
  type TransactionExecutor,
  WORKER_DISPATCH_CONTEXT,
} from '@repo/api-core';

import { HANDLER_TIMEOUT_MS, isTerminalStatus, resolveFailureOutcome } from '../../domain/job-lifecycle';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';
import {
  type JobRecord,
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from '../ports/jobs.repository.port';
import { JobHandlersRegistry } from '../services/job-handlers.registry';

const WORKER_ID = `worker-${Math.random().toString(36).slice(2, 10)}`;

@Injectable()
export class ProcessJobsUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly tenantContextService: TenantContextService,
    private readonly jobHandlersRegistry: JobHandlersRegistry,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(): Promise<void> {
    const dueJobs = await this.tenantContextService.runAsync(
      WORKER_DISPATCH_CONTEXT,
      () => this.jobsRepository.claimDueJobs(20, WORKER_ID),
    );

    for (const job of dueJobs) {
      try {
        await this.tenantContextService.runAsync(
          tenantContextForJob({
            organizationId: job.organizationId ?? null,
            actorUserId: job.createdById ?? null,
          }),
          () => this.processJob(job),
        );
      } catch (error) {
        this.tenantContextService.runAsync(
          WORKER_DISPATCH_CONTEXT,
          async () => {
            const message = error instanceof Error ? error.message : 'Unknown processing error';
            await this.transactionPort.withTenant(
              WORKER_DISPATCH_CONTEXT,
              async (tx: TransactionExecutor) => {
                await this.jobObservabilityRepository.recordEvent(
                  { jobId: job.id, organizationId: job.organizationId ?? null, type: 'failed', message: `Batch isolation: ${message}` },
                  tx,
                );
              },
            );
          },
        ).catch(() => {});
      }
    }
  }

  private async processJob(job: JobRecord) {
    const organizationId = job.organizationId ?? null;

    const attempt = await this.transactionPort.withTenant(
      WORKER_DISPATCH_CONTEXT,
      async (tx: TransactionExecutor) => {
        const a = await this.jobObservabilityRepository.startAttempt(
          { jobId: job.id, organizationId, attemptNumber: job.attempts },
          tx,
        );
        await this.jobObservabilityRepository.recordEvent(
          { jobId: job.id, organizationId, attemptId: a.id, type: 'claimed' },
          tx,
        );
        return a;
      },
    ) as Awaited<ReturnType<JobObservabilityRepositoryPort['startAttempt']>>;

    const handler = this.jobHandlersRegistry.getHandler(job.type);

    if (!handler) {
      const message = `No handler registered for job type "${job.type}"`;

      await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        async (tx: TransactionExecutor) => {
          const failedJob = await this.jobsRepository.markFailed(job.id, message, WORKER_ID, job.attempts, tx);
          if (!failedJob) {
            return;
          }

          await this.jobObservabilityRepository.finishAttempt(attempt.id, { status: 'FAILED', errorMessage: message }, tx);
          await this.jobObservabilityRepository.recordEvent(
            { jobId: job.id, organizationId, attemptId: attempt.id, type: 'no_handler', message },
            tx,
          );
          await this.propagateToDependents(job.id, organizationId, tx);
        },
      );
      return;
    }

    try {
      await this.withTimeout(
        handler({ jobId: job.id, payload: job.payload, organizationId, createdById: job.createdById ?? null }),
        HANDLER_TIMEOUT_MS,
        `Handler timed out after ${HANDLER_TIMEOUT_MS}ms`,
      );
      await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        async (tx: TransactionExecutor) => {
          const completedJob = await this.jobsRepository.markCompleted(job.id, WORKER_ID, job.attempts, tx);
          if (!completedJob) {
            return;
          }

          await this.jobObservabilityRepository.finishAttempt(attempt.id, { status: 'COMPLETED' }, tx);
          await this.jobObservabilityRepository.recordEvent(
            { jobId: job.id, organizationId, attemptId: attempt.id, type: 'completed' },
            tx,
          );
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown processing error';
      const redactedPayload = redactSensitive(job.payload);
      const metadata = isJsonObject(redactedPayload) ? { payload: redactedPayload } : null;

      await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        async (tx: TransactionExecutor) => {
          const outcome = resolveFailureOutcome({ attempts: job.attempts, maxAttempts: job.maxAttempts });

          if (outcome.action === 'retry') {
            const requeuedJob = await this.jobsRepository.requeueForRetry(job.id, outcome.retryAt, message, WORKER_ID, job.attempts, tx);
            if (!requeuedJob) {
              return;
            }

            await this.jobObservabilityRepository.finishAttempt(attempt.id, { status: 'FAILED', errorMessage: message }, tx);
            await this.jobObservabilityRepository.recordEvent(
              { jobId: job.id, organizationId, attemptId: attempt.id, type: 'retry_scheduled', message, metadata },
              tx,
            );
            return;
          }

          const failedJob = await this.jobsRepository.markFailed(job.id, message, WORKER_ID, job.attempts, tx);
          if (!failedJob) {
            return;
          }

          await this.jobObservabilityRepository.finishAttempt(attempt.id, { status: 'FAILED', errorMessage: message }, tx);
          await this.jobObservabilityRepository.recordEvent(
            { jobId: job.id, organizationId, attemptId: attempt.id, type: 'failed', message, metadata },
            tx,
          );
          await this.propagateToDependents(job.id, organizationId, tx);
        },
      );
    }
  }

  private async propagateToDependents(
    jobId: string,
    organizationId: string | null,
    tx: TransactionExecutor,
  ): Promise<void> {
    const dependents = await this.jobsRepository.listDependents(jobId, tx);

    for (const dependent of dependents) {
      if (isTerminalStatus(dependent.status as any)) {
        continue;
      }

      const blockedJob = await this.jobsRepository.markBlocked(
        dependent.jobId,
        `Dependency ${jobId} failed`,
        tx,
      );
      if (!blockedJob) {
        continue;
      }

      await this.jobObservabilityRepository.recordEvent(
        {
          jobId: dependent.jobId,
          organizationId,
          type: 'dependency_failed',
          message: `Dependency ${jobId} failed/cancelled`,
        },
        tx,
      );
    }
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
