import { HttpStatus } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";

import {
  PREFERENCE_LANGUAGES,
  PREFERENCE_THEMES,
  type PreferenceLanguage,
  type PreferenceTheme,
} from "./preferences.constants";

const isSupportedTimezone = (timezone: string): boolean => {
  // Intl.supportedValuesOf('timeZone') only lists ICU's canonical zones and omits
  // valid IANA aliases (e.g. Asia/Ho_Chi_Minh is missing on ICU >= 78, which lists
  // Asia/Saigon instead), and the canonical set drifts between Node/ICU versions.
  // Constructing a formatter accepts any zone IANA recognizes and throws otherwise.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

export function assertValidPreferenceTheme(theme: string): asserts theme is PreferenceTheme {
  if (!PREFERENCE_THEMES.includes(theme as PreferenceTheme)) {
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
  if (!PREFERENCE_LANGUAGES.includes(language as PreferenceLanguage)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      "Unsupported language preference",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function assertValidTimezone(timezone: string): void {
  if (!isSupportedTimezone(timezone)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      "Unsupported timezone preference",
      HttpStatus.BAD_REQUEST,
    );
  }
}
