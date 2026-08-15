import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  ACTIVITY_EMITTER,
  type ActivityEmitter,
  isJsonObject,
  redactSensitive,
  tenantContextForJob,
  TenantContextService,
  TRANSACTION_PORT,
  type TransactionExecutor,
  type TransactionPort,
  WORKER_DISPATCH_CONTEXT,
} from '@repo/api-core';

import { HANDLER_TIMEOUT_MS, resolveFailureOutcome } from '../../domain/job-lifecycle';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';
import {
  type JobRecord,
  JOBS_REPOSITORY,
  type JobScope,
  type JobsRepositoryPort,
} from '../ports/jobs.repository.port';
import { JobHandlersRegistry } from '../services/job-handlers.registry';
import { PropagationService } from '../services/propagation.service';

const WORKER_ID = `worker-${Math.random().toString(36).slice(2, 10)}`;

@Injectable()
export class ProcessJobsUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly tenantContextService: TenantContextService,
    private readonly jobHandlersRegistry: JobHandlersRegistry,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    private readonly propagationService: PropagationService,
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
        ).catch(() => undefined);
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
    );

    const handler = this.jobHandlersRegistry.getHandler(job.type);

    if (!handler) {
      const message = `No handler registered for job type "${job.type}"`;

      await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        async (tx: TransactionExecutor) => {
          const failed = await this.jobsRepository.markFailed(job.id, message, WORKER_ID, job.attempts, tx);
          if (!failed) {
            return;
          }
          await this.jobObservabilityRepository.finishAttempt(attempt.id, { status: 'FAILED', errorMessage: message }, tx);
          await this.jobObservabilityRepository.recordEvent(
            { jobId: job.id, organizationId, attemptId: attempt.id, type: 'no_handler', message },
            tx,
          );
          await this.propagationService.propagateBlocked(
            job.id,
            this.scopeFromOrg(organizationId),
            organizationId,
            'no handler',
            tx,
          );
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
          const completed = await this.jobsRepository.markCompleted(job.id, WORKER_ID, job.attempts, tx);
          if (!completed) {
            return;
          }
          await this.jobObservabilityRepository.finishAttempt(attempt.id, { status: 'COMPLETED' }, tx);
          await this.jobObservabilityRepository.recordEvent(
            { jobId: job.id, organizationId, attemptId: attempt.id, type: 'completed' },
            tx,
          );
          if (job.organizationId) {
            await this.activityEmitter.emit(
              {
                organizationId: job.organizationId,
                summary: `Background job completed (${job.type})`,
                entityType: 'job',
                entityId: job.id,
                actorId: job.createdById ?? null,
                visibility: 'INTERNAL',
              },
              tx,
            );
          }
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
            const requeued = await this.jobsRepository.requeueForRetry(job.id, outcome.retryAt, message, WORKER_ID, job.attempts, tx);
            if (!requeued) {
              return;
            }
            await this.jobObservabilityRepository.finishAttempt(attempt.id, { status: 'FAILED', errorMessage: message }, tx);
            await this.jobObservabilityRepository.recordEvent(
              { jobId: job.id, organizationId, attemptId: attempt.id, type: 'retry_scheduled', message, metadata },
              tx,
            );
            return;
          }

          const failed = await this.jobsRepository.markFailed(job.id, message, WORKER_ID, job.attempts, tx);
          if (!failed) {
            return;
          }
          await this.jobObservabilityRepository.finishAttempt(attempt.id, { status: 'FAILED', errorMessage: message }, tx);
          await this.jobObservabilityRepository.recordEvent(
            { jobId: job.id, organizationId, attemptId: attempt.id, type: 'failed', message, metadata },
            tx,
          );

          await this.propagationService.propagateBlocked(
            job.id,
            this.scopeFromOrg(organizationId),
            organizationId,
            'failed',
            tx,
          );
        },
      );
    }
  }

  private scopeFromOrg(organizationId: string | null): JobScope {
    return organizationId
      ? { type: 'organization', organizationId }
      : { type: 'platform' };
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