import { Global, Module } from "@nestjs/common";
import { BACKGROUND_JOB_ENQUEUER, BACKGROUND_JOB_ENQUEUER_WITH_RESULT } from "@repo/api-runtime";

import { JobsMapper } from "./application/jobs.mapper";
import { JobsProcessor } from "./application/jobs.processor";
import { JobsService } from "./application/jobs.service";
import { JOB_OBSERVABILITY_REPOSITORY } from "./application/ports/job-observability.repository.port";
import { JOBS_REPOSITORY } from "./application/ports/jobs.repository.port";
import { JobHandlersRegistry } from "./application/services/job-handlers.registry";
import { PropagationService } from "./application/services/propagation.service";
import { AddJobDependencyUseCase } from "./application/use-cases/add-job-dependency.use-case";
import { CancelJobUseCase } from "./application/use-cases/cancel-job.use-case";
import { EnqueueJobUseCase } from "./application/use-cases/enqueue-job.use-case";
import { GetJobLogsUseCase } from "./application/use-cases/get-job-logs.use-case";
import { GetJobMetricsUseCase } from "./application/use-cases/get-job-metrics.use-case";
import { GetJobUseCase } from "./application/use-cases/get-job.use-case";
import { ListJobDependenciesUseCase } from "./application/use-cases/list-job-dependencies.use-case";
import { ListJobsUseCase } from "./application/use-cases/list-jobs.use-case";
import { ProcessJobsUseCase } from "./application/use-cases/process-jobs.use-case";
import { JobObservabilityRepository } from "./infrastructure/job-observability.repository";
import { JobsRepository } from "./infrastructure/jobs.repository";
import { AdminJobsController } from "./presentation/admin-jobs.controller";

@Global()
@Module({
  imports: [],
  controllers: [AdminJobsController],
  providers: [
    JobsRepository,
    JobObservabilityRepository,
    {
      provide: JOB_OBSERVABILITY_REPOSITORY,
      useExisting: JobObservabilityRepository,
    },
    JobsMapper,
    JobHandlersRegistry,
    EnqueueJobUseCase,
    ListJobsUseCase,
    PropagationService,
    CancelJobUseCase,
    ProcessJobsUseCase,
    GetJobUseCase,
    GetJobLogsUseCase,
    GetJobMetricsUseCase,
    AddJobDependencyUseCase,
    ListJobDependenciesUseCase,
    JobsService,
    JobsProcessor,
    {
      provide: JOBS_REPOSITORY,
      useExisting: JobsRepository,
    },
    {
      provide: BACKGROUND_JOB_ENQUEUER,
      useExisting: JobsService,
    },
    {
      provide: BACKGROUND_JOB_ENQUEUER_WITH_RESULT,
      useExisting: JobsService,
    },
  ],
  exports: [
    BACKGROUND_JOB_ENQUEUER,
    BACKGROUND_JOB_ENQUEUER_WITH_RESULT,
    JOBS_REPOSITORY,
    JOB_OBSERVABILITY_REPOSITORY,
  ],
})
export class JobsModule {}
