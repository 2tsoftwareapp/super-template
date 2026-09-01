import { describe, expect, it } from "vitest";

import type { JobMetricsDto } from "@/lib/api-types";

import {
  getActiveJobsCount,
  getCompletedJobsCount,
  getFailedJobsCount,
  getStatusCount,
  getTotalJobsCount,
} from "../jobs.metrics";

describe("jobs.metrics", () => {
  const metrics = {
    totalCompleted: 12,
    totalFailed: 2,
    byStatus: [
      { status: "PENDING", total: 3 },
      { status: "PROCESSING", total: 1 },
      { status: "COMPLETED", total: 12 },
      { status: "FAILED", total: 2 },
    ],
  } as unknown as JobMetricsDto;

  it("returns the total for a known status", () => {
    expect(getStatusCount(metrics, "COMPLETED")).toBe(12);
    expect(getStatusCount(metrics, "PENDING")).toBe(3);
  });

  it("returns 0 for an unknown status", () => {
    expect(getStatusCount(metrics, "CANCELLED")).toBe(0);
  });

  it("calculates active jobs count (pending + processing)", () => {
    expect(getActiveJobsCount(metrics)).toBe(4);
  });

  it("returns failed and completed counts", () => {
    expect(getFailedJobsCount(metrics)).toBe(2);
    expect(getCompletedJobsCount(metrics)).toBe(12);
  });

  it("calculates total jobs across statuses", () => {
    expect(getTotalJobsCount(metrics)).toBe(18);
  });
});
