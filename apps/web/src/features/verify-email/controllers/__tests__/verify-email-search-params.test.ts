import { describe, expect, it } from "vitest";

import { parseVerifyEmailSearchParams } from "../verify-email-search-params";

describe("parseVerifyEmailSearchParams", () => {
  it("parses a present token", () => {
    const sp = new URLSearchParams("token=abc-123");
    expect(parseVerifyEmailSearchParams(sp)).toEqual({ token: "abc-123" });
  });

  it("defaults a missing token to empty string", () => {
    expect(parseVerifyEmailSearchParams(new URLSearchParams())).toEqual({ token: "" });
  });

  it("recovers an over-long token to empty string", () => {
    const sp = new URLSearchParams(`token=${"x".repeat(600)}`);
    expect(parseVerifyEmailSearchParams(sp)).toEqual({ token: "" });
  });

  it("ignores unrelated query params", () => {
    const sp = new URLSearchParams("source=email&theme=dark");
    expect(parseVerifyEmailSearchParams(sp)).toEqual({ token: "" });
  });
});
