import type {
  BackgroundJobEnqueueInput,
  BackgroundJobEnqueuerWithResult,
  BackgroundJobRef,
} from "@repo/api-runtime";

import { Injectable } from "@nestjs/common";

import type { EnqueueJobCommand, JobHandler } from "./jobs.types";

import { JobHandlersRegistry } from "./services/job-handlers.registry";
import { EnqueueJobUseCase } from "./use-cases/enqueue-job.use-case";
import { ProcessJobsUseCase } from "./use-cases/process-jobs.use-case";

export type { JobHandler } from "./jobs.types";

/**
 * Cross-module facade for the background-job system: handler registration, the
 * BACKGROUND_JOB_ENQUEUER port (enqueue), and the scheduled processor entry
 * point (processDueJobs). Admin read/manage endpoints inject the job use cases
 * directly instead of this facade.
 */
@Injectable()
export class JobsService implements BackgroundJobEnqueuerWithResult {
  constructor(
    private readonly enqueueJobUseCase: EnqueueJobUseCase,
    private readonly processJobsUseCase: ProcessJobsUseCase,
    private readonly jobHandlersRegistry: JobHandlersRegistry,
  ) {}

  registerHandler(type: string, handler: JobHandler) {
    this.jobHandlersRegistry.registerHandler(type, handler);
  }

  enqueue(input: EnqueueJobCommand | BackgroundJobEnqueueInput) {
    return this.enqueueJobUseCase.execute(input);
  }

  enqueueWithResult(input: BackgroundJobEnqueueInput): Promise<BackgroundJobRef> {
    return this.enqueueJobUseCase
      .execute(input)
      .then((view) => ({ id: view.id, status: view.status }));
  }

  processDueJobs() {
    return this.processJobsUseCase.execute();
  }
}
