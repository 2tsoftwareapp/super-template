import { describe, expect, it } from "vitest";

import type { JobMetricsDto } from "@/lib/api-types";

import { getStatusCount } from "../jobs.metrics";

describe("jobs.metrics", () => {
  const metrics = {
    byStatus: [
      { status: "PENDING", total: 3 },
      { status: "PROCESSING", total: 1 },
      { status: "COMPLETED", total: 12 },
    ],
  } as unknown as JobMetricsDto;

  it("returns the total for a known status", () => {
    expect(getStatusCount(metrics, "COMPLETED")).toBe(12);
    expect(getStatusCount(metrics, "PENDING")).toBe(3);
  });

  it("returns 0 for an unknown status", () => {
    expect(getStatusCount(metrics, "CANCELLED")).toBe(0);
  });
});
