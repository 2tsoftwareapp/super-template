import { Injectable } from '@nestjs/common';

import { JobObservabilityRepository } from '../../infrastructure/job-observability.repository';

export interface JobMetricsQuery {
  from?: string;
  to?: string;
}

@Injectable()
export class GetJobMetricsUseCase {
  constructor(
    private readonly jobObservabilityRepository: JobObservabilityRepository,
  ) {}

  async execute(query: JobMetricsQuery) {
    const [statusCounts, typeCounts, retryCounts, averageDurationMs] =
      await Promise.all([
        this.jobObservabilityRepository.getStatusCounts(query),
        this.jobObservabilityRepository.getTypeCounts(query),
        this.jobObservabilityRepository.getRetryCounts(query),
        this.jobObservabilityRepository.getAverageDurationMs(query),
      ]);

    const completed =
      statusCounts.find((row) => row.status === 'COMPLETED')?.total ?? 0;
    const failed =
      statusCounts.find((row) => row.status === 'FAILED')?.total ?? 0;
    const terminalCount = Number(completed) + Number(failed);

    return {
      byStatus: statusCounts.map((row) => ({
        status: row.status,
        total: Number(row.total),
      })),
      byType: typeCounts.map((row) => ({
        type: row.type,
        total: Number(row.total),
      })),
      averageDurationMs,
      retryRate: retryCounts.terminal > 0 ? retryCounts.retried / retryCounts.terminal : 0,
      failureRate: terminalCount > 0 ? Number(failed) / terminalCount : 0,
      totalCompleted: Number(completed),
      totalFailed: Number(failed),
    };
  }
}
