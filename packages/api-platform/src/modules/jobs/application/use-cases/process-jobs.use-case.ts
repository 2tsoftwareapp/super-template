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

import { HANDLER_TIMEOUT_MS, isBlockingStatus, resolveFailureOutcome } from '../../domain/job-lifecycle';
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
        // Per-job failure isolation (T-003): log and continue instead of throwing.
        this.tenantContextService.runAsync(
          WORKER_DISPATCH_CONTEXT,
          async () => {
            const message = error instanceof Error ? error.message : 'Unknown processing error';
            await this.transactionPort.withTenant(
              WORKER_DISPATCH_CONTEXT,
              async (tx) => {
                await this.jobObservabilityRepository.recordEvent(
                  {
                    jobId: job.id,
                    organizationId: job.organizationId ?? null,
                    type: 'failed',
                    message: `Batch isolation: ${message}`,
                  },
                  tx,
                );
              },
            );
          },
        ).catch(() => { /* swallow */ });
      }
    }
  }

  private async processJob(job: JobRecord) {
    const organizationId = job.organizationId ?? null;

    // --- Propagate dependency failures (T-007) ---
    await this.propagateDependencyFailures(job.id, organizationId);

    const attempt = await this.transactionPort.withTenant(
      WORKER_DISPATCH_CONTEXT,
      (transaction) =>
        this.jobObservabilityRepository.startAttempt(
          { jobId: job.id, organizationId, attemptNumber: job.attempts },
          transaction,
        ),
    ) as Awaited<ReturnType<JobObservabilityRepositoryPort['startAttempt']>>;
    await this.transactionPort.withTenant(
      WORKER_DISPATCH_CONTEXT,
      (transaction) =>
        this.jobObservabilityRepository.recordEvent(
          { jobId: job.id, organizationId, attemptId: attempt.id, type: 'claimed' },
          transaction,
        ),
    );

    const handler = this.jobHandlersRegistry.getHandler(job.type);

    if (!handler) {
      const message = `No handler registered for job type "${job.type}"`;

      await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          await this.jobsRepository.markFailed(job.id, message, transaction);
          await this.jobObservabilityRepository.finishAttempt(
            attempt.id,
            { status: 'FAILED', errorMessage: message },
            transaction,
          );
          await this.jobObservabilityRepository.recordEvent(
            {
              jobId: job.id,
              organizationId,
              attemptId: attempt.id,
              type: 'no_handler',
              message,
            },
            transaction,
          );
        },
      );
      return;
    }

    try {
      // T-011: Handler timeout
      await this.withTimeout(
        handler({
          jobId: job.id,
          payload: job.payload,
          organizationId,
          createdById: job.createdById ?? null,
        }),
        HANDLER_TIMEOUT_MS,
        `Handler timed out after ${HANDLER_TIMEOUT_MS}ms`,
      );
      await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          // T-010: combined in single transaction
          await this.jobsRepository.markCompleted(job.id, transaction);
          await this.jobObservabilityRepository.finishAttempt(
            attempt.id,
            { status: 'COMPLETED' },
            transaction,
          );
          await this.jobObservabilityRepository.recordEvent(
            { jobId: job.id, organizationId, attemptId: attempt.id, type: 'completed' },
            transaction,
          );
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';
      const redactedPayload = redactSensitive(job.payload);
      const metadata = isJsonObject(redactedPayload)
        ? { payload: redactedPayload }
        : null;

      await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          // T-010: combined in single transaction
          await this.jobObservabilityRepository.finishAttempt(
            attempt.id,
            { status: 'FAILED', errorMessage: message },
            transaction,
          );

          const outcome = resolveFailureOutcome({
            attempts: job.attempts,
            maxAttempts: job.maxAttempts,
          });

          if (outcome.action === 'retry') {
            await this.jobsRepository.requeueForRetry(
              job.id,
              outcome.retryAt,
              message,
              transaction,
            );
            await this.jobObservabilityRepository.recordEvent(
              {
                jobId: job.id,
                organizationId,
                attemptId: attempt.id,
                type: 'retry_scheduled',
                message,
                metadata,
              },
              transaction,
            );
            return;
          }

          await this.jobsRepository.markFailed(job.id, message, transaction);
          await this.jobObservabilityRepository.recordEvent(
            {
              jobId: job.id,
              organizationId,
              attemptId: attempt.id,
              type: 'failed',
              message,
              metadata,
            },
            transaction,
          );

          // Propagate failure to dependents (T-007)
          await this.propagateDependencyFailures(job.id, organizationId);
        },
      );
    }
  }

  private async propagateDependencyFailures(jobId: string, organizationId: string | null) {
    try {
      const deps = await this.jobObservabilityRepository.listDependencies(jobId);
      for (const dep of deps) {
        if (isBlockingStatus(dep.dependsOnJobStatus as any)) {
          await this.transactionPort.withTenant(
            WORKER_DISPATCH_CONTEXT,
            async (tx: TransactionExecutor) => {
              await this.jobsRepository.markBlocked(
                dep.dependsOnJobId,
                `Dependency ${jobId} ${dep.dependsOnJobStatus}`,
                tx,
              );
            },
          );
        }
      }
    } catch {
      // Swallow: propagation is best-effort
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