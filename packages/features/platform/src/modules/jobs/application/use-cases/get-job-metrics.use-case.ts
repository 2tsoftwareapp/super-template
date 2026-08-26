import { Inject, Injectable } from "@nestjs/common";

import type { JobScope } from "../ports/jobs.repository.port";

import {
  JOB_OBSERVABILITY_REPOSITORY,
  type JobObservabilityRepositoryPort,
} from "../ports/job-observability.repository.port";

export interface JobMetricsQuery {
  from?: string;
  to?: string;
}

@Injectable()
export class GetJobMetricsUseCase {
  constructor(
    @Inject(JOB_OBSERVABILITY_REPOSITORY)
    private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
  ) {}

  async execute(params: JobMetricsQuery & { scope: JobScope }) {
    const { scope, ...query } = params;
    const [statusCounts, typeCounts, retryCounts, averageDurationMs] = await Promise.all([
      this.jobObservabilityRepository.getStatusCounts(scope, query),
      this.jobObservabilityRepository.getTypeCounts(scope, query),
      this.jobObservabilityRepository.getRetryCounts(scope, query),
      this.jobObservabilityRepository.getAverageDurationMs(scope, query),
    ]);

    const completed = statusCounts.find((row) => row.status === "COMPLETED")?.total ?? 0;
    const failed = statusCounts.find((row) => row.status === "FAILED")?.total ?? 0;
    const terminalCount = Number(completed) + Number(failed);

    return {
      byStatus: statusCounts.map((row) => ({ status: row.status, total: Number(row.total) })),
      byType: typeCounts.map((row) => ({ type: row.type, total: Number(row.total) })),
      averageDurationMs,
      retryRate: retryCounts.terminal > 0 ? retryCounts.retried / retryCounts.terminal : 0,
      failureRate: terminalCount > 0 ? Number(failed) / terminalCount : 0,
      totalCompleted: Number(completed),
      totalFailed: Number(failed),
    };
  }
}
