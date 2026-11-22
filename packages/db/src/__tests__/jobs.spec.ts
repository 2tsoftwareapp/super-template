import { describe, expect, it } from "vitest";

import { retryDelaySeconds } from "../jobs";

describe("retryDelaySeconds", () => {
  it("doubles from 15 seconds per attempt", () => {
    expect([0, 1, 2, 3].map(retryDelaySeconds)).toEqual([15, 30, 60, 120]);
  });

  it("caps at five minutes so a poisoned job cannot starve the queue", () => {
    expect(retryDelaySeconds(5)).toBe(300);
    expect(retryDelaySeconds(30)).toBe(300);
  });
});
