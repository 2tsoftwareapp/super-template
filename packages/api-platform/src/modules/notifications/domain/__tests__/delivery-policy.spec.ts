import { describe, expect, it } from "vitest";
import { MAX_DELIVERY_RETRY_ATTEMPTS } from "../delivery-policy";

describe("delivery-policy", () => {
  it("defines max retry attempts", () => {
    expect(MAX_DELIVERY_RETRY_ATTEMPTS).toBe(5);
    expect(MAX_DELIVERY_RETRY_ATTEMPTS).toBeGreaterThan(0);
  });
});