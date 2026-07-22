import { describe, expect, it } from "vitest";

import { summarizeJobMetrics } from "../dashboard.metrics";

describe("summarizeJobMetrics", () => {
  it("counts pending/processing/failed from byStatus and totalFailed", () => {
    const summary = summarizeJobMetrics({
      byStatus: [
        { status: "PENDING", total: 3 },
        { status: "PROCESSING", total: 2 },
        { status: "FAILED", total: 9 },
        { status: "COMPLETED", total: 40 },
      ],
      byType: [],
      retryRate: 0,
      failureRate: 0,
      totalCompleted: 40,
      totalFailed: 7,
    });

    expect(summary).toEqual({
      pending: 3,
      processing: 2,
      failed: 7,
      active: 5,
    });
  });

  it("falls back to FAILED bucket when totalFailed is absent", () => {
    const summary = summarizeJobMetrics({
      byStatus: [{ status: "FAILED", total: 4 }],
      byType: [],
      retryRate: 0,
      failureRate: 0,
      totalCompleted: 0,
      totalFailed: undefined as unknown as number,
    });

    expect(summary.failed).toBe(4);
  });

  it("returns zeros for empty metrics", () => {
    expect(summarizeJobMetrics(undefined)).toEqual({
      pending: 0,
      processing: 0,
      failed: 0,
      active: 0,
    });
  });
});
