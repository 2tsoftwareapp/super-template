import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";

import {
  PREFERENCE_TIMEZONE_MAX_LENGTH,
  assertValidPreferenceLanguage,
  assertValidPreferenceTheme,
  assertValidTimezone,
  isSupportedPreferenceLanguage,
  isSupportedPreferenceTheme,
  isSupportedPreferenceTimezone,
} from "../preferences.validation";

describe("preferences validation (single source of truth)", () => {
  describe("theme", () => {
    it("accepts the supported themes", () => {
      expect(isSupportedPreferenceTheme("system")).toBe(true);
      expect(isSupportedPreferenceTheme("light")).toBe(true);
      expect(isSupportedPreferenceTheme("dark")).toBe(true);
    });

    it("rejects unknown themes and non-strings", () => {
      expect(isSupportedPreferenceTheme("blue")).toBe(false);
      expect(isSupportedPreferenceTheme(1)).toBe(false);
      expect(isSupportedPreferenceTheme(null)).toBe(false);
    });

    it("asserts with a validation error for unsupported themes", () => {
      expect(() => assertValidPreferenceTheme("blue" as never)).toThrowError(
        expect.objectContaining({ code: ERROR_CODES.VALIDATION_FAILED }),
      );
      expect(() => assertValidPreferenceTheme("dark")).not.toThrow();
    });
  });

  describe("language", () => {
    it("accepts the supported languages", () => {
      expect(isSupportedPreferenceLanguage("en")).toBe(true);
      expect(isSupportedPreferenceLanguage("vi")).toBe(true);
    });

    it("rejects unknown languages and non-strings", () => {
      expect(isSupportedPreferenceLanguage("fr")).toBe(false);
      expect(isSupportedPreferenceLanguage(undefined)).toBe(false);
    });

    it("asserts with a validation error for unsupported languages", () => {
      expect(() => assertValidPreferenceLanguage("fr" as never)).toThrowError(
        expect.objectContaining({ code: ERROR_CODES.VALIDATION_FAILED }),
      );
    });
  });

  describe("timezone", () => {
    it("accepts Vietnam modern timezone alias even when runtime ICU only lists Asia/Saigon", () => {
      expect(isSupportedPreferenceTimezone("Asia/Ho_Chi_Minh")).toBe(true);
      expect(() => assertValidTimezone("Asia/Ho_Chi_Minh")).not.toThrow();
    });

    it("rejects unsupported timezones", () => {
      expect(isSupportedPreferenceTimezone("Mars/Olympus")).toBe(false);
      expect(() => assertValidTimezone("Mars/Olympus")).toThrowError(
        expect.objectContaining({
          code: ERROR_CODES.VALIDATION_FAILED,
        }),
      );
    });

    it("rejects empty and non-string values", () => {
      expect(isSupportedPreferenceTimezone("")).toBe(false);
      expect(isSupportedPreferenceTimezone(42)).toBe(false);
      expect(isSupportedPreferenceTimezone(null)).toBe(false);
    });

    it("rejects values beyond the timezone length cap before reaching Intl", () => {
      const tooLong = "a".repeat(PREFERENCE_TIMEZONE_MAX_LENGTH + 1);
      expect(isSupportedPreferenceTimezone(tooLong)).toBe(false);
      expect(isSupportedPreferenceTimezone("a".repeat(PREFERENCE_TIMEZONE_MAX_LENGTH))).toBe(false);
    });
  });
});
