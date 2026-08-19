import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "@repo/api-core";

import { assertValidTimezone } from "../preferences.validation";

describe("preferences validation", () => {
  it("accepts Vietnam modern timezone alias even when runtime ICU only lists Asia/Saigon", () => {
    expect(() => assertValidTimezone("Asia/Ho_Chi_Minh")).not.toThrow();
  });

  it("rejects unsupported timezones", () => {
    expect(() => assertValidTimezone("Mars/Olympus")).toThrowError(
      expect.objectContaining({
        code: ERROR_CODES.VALIDATION_FAILED,
      }),
    );
  });
});
