import { HttpStatus } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import {
  PREFERENCE_LANGUAGES,
  PREFERENCE_THEMES,
  type PreferenceLanguage,
  type PreferenceTheme,
} from "./preferences.constants";

/**
 * Single source of truth for user-preference validation rules. Pure predicates
 * live here; the presentation DTO delegates to them via custom class-validator
 * decorators (see presentation/preferences.validators.ts) and the use-cases use
 * the assert* helpers below, so the HTTP layer and the application layer can
 * never drift apart.
 */

/** IANA zone identifiers are short; anything longer can never be valid, so it
 * is rejected before reaching Intl (also caps request sizes at the edge). */
export const PREFERENCE_TIMEZONE_MAX_LENGTH = 64;

export function isSupportedPreferenceTheme(value: unknown): value is PreferenceTheme {
  return typeof value === "string" && PREFERENCE_THEMES.includes(value as PreferenceTheme);
}

export function isSupportedPreferenceLanguage(value: unknown): value is PreferenceLanguage {
  return typeof value === "string" && PREFERENCE_LANGUAGES.includes(value as PreferenceLanguage);
}

export function isSupportedPreferenceTimezone(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > PREFERENCE_TIMEZONE_MAX_LENGTH
  ) {
    return false;
  }

  // Intl.supportedValuesOf('timeZone') only lists ICU's canonical zones and omits
  // valid IANA aliases (e.g. Asia/Ho_Chi_Minh is missing on ICU >= 78, which lists
  // Asia/Saigon instead), and the canonical set drifts between Node/ICU versions.
  // Constructing a formatter accepts any zone IANA recognizes and throws otherwise.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function assertValidPreferenceTheme(theme: string): asserts theme is PreferenceTheme {
  if (!isSupportedPreferenceTheme(theme)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      "Unsupported theme preference",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function assertValidPreferenceLanguage(
  language: string,
): asserts language is PreferenceLanguage {
  if (!isSupportedPreferenceLanguage(language)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      "Unsupported language preference",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function assertValidTimezone(timezone: string): void {
  if (!isSupportedPreferenceTimezone(timezone)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      "Unsupported timezone preference",
      HttpStatus.BAD_REQUEST,
    );
  }
}
