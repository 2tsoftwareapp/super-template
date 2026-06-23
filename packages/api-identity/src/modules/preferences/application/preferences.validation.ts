import { HttpStatus } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import {
  PREFERENCE_LANGUAGES,
  PREFERENCE_THEMES,
  type PreferenceLanguage,
  type PreferenceTheme,
} from './preferences.constants';

const supportedTimezones =
  typeof Intl.supportedValuesOf === 'function'
    ? new Set(Intl.supportedValuesOf('timeZone'))
    : new Set(['UTC']);

export function assertValidPreferenceTheme(
  theme: string,
): asserts theme is PreferenceTheme {
  if (!PREFERENCE_THEMES.includes(theme as PreferenceTheme)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      'Unsupported theme preference',
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
      'Unsupported language preference',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function assertValidTimezone(timezone: string): void {
  if (!supportedTimezones.has(timezone)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      'Unsupported timezone preference',
      HttpStatus.BAD_REQUEST,
    );
  }
}
