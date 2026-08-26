import { describe, expect, it } from "vitest";
import { AppError } from "@repo/api-runtime";

import { assertAllowedRedirectUri } from "../redirect-allowlist";

describe("redirect-allowlist", () => {
  it("allows exact match", () => {
    expect(() =>
      assertAllowedRedirectUri("https://example.com/cb", [], ["https://example.com/cb"]),
    ).not.toThrow();
  });

  it("allows origin match", () => {
    expect(() =>
      assertAllowedRedirectUri("https://example.com/cb?x=1", ["https://example.com"], []),
    ).not.toThrow();
  });

  it("rejects non-allowed origin", () => {
    expect(() =>
      assertAllowedRedirectUri("https://evil.com/cb", ["https://example.com"], []),
    ).toThrow(AppError);
  });

  it("rejects non-http schemes unless exact", () => {
    expect(() => assertAllowedRedirectUri("myapp://cb", ["https://example.com"], [])).toThrow(
      AppError,
    );
    expect(() => assertAllowedRedirectUri("myapp://cb", [], ["myapp://cb"])).not.toThrow();
  });

  it("rejects invalid URL", () => {
    expect(() => assertAllowedRedirectUri("not-a-url", ["https://example.com"], [])).toThrow(
      AppError,
    );
  });
});
