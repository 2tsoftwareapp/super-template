import { describe, expect, it, vi } from "vitest";

import { GetJobMetricsUseCase } from "../get-job-metrics.use-case";

const scope = { type: "platform" as const };

describe("GetJobMetricsUseCase", () => {
  it("computes retry rate and failure rate from terminal jobs only", async () => {
    const jobObservabilityRepository = {
      getStatusCounts: vi.fn(async () => [
        { status: "COMPLETED", total: 8 },
        { status: "FAILED", total: 2 },
        { status: "PENDING", total: 5 },
      ]),
      getTypeCounts: vi.fn(async () => [{ type: "send-mail", total: 10 }]),
      getRetryCounts: vi.fn(async () => ({ retried: 3, terminal: 10 })),
      getAverageDurationMs: vi.fn(async () => 1234),
    };

    const useCase = new GetJobMetricsUseCase(jobObservabilityRepository as never);

    const result = await useCase.execute({ scope });

    expect(result).toMatchObject({
      totalCompleted: 8,
      totalFailed: 2,
      retryRate: 0.3,
      failureRate: 0.2,
      averageDurationMs: 1234,
    });
    expect(result.byStatus).toEqual(expect.arrayContaining([{ status: "PENDING", total: 5 }]));
  });

  it("returns zero rates when there are no terminal jobs yet", async () => {
    const jobObservabilityRepository = {
      getStatusCounts: vi.fn(async () => [{ status: "PENDING", total: 1 }]),
      getTypeCounts: vi.fn(async () => []),
      getRetryCounts: vi.fn(async () => ({ retried: 0, terminal: 0 })),
      getAverageDurationMs: vi.fn(async () => null),
    };

    const useCase = new GetJobMetricsUseCase(jobObservabilityRepository as never);

    const result = await useCase.execute({ from: "2026-01-01", scope });

    expect(result.retryRate).toBe(0);
    expect(result.failureRate).toBe(0);
    expect(result.averageDurationMs).toBeNull();
    expect(jobObservabilityRepository.getStatusCounts).toHaveBeenCalledWith(scope, {
      from: "2026-01-01",
    });
  });
});
