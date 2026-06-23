import { HttpStatus } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

export const assertAllowedRedirectUri = (
  redirectUri: string,
  allowedOrigins: string[],
): void => {
  let parsed: URL;

  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new AppError(
      ERROR_CODES.SSO_INVALID_REDIRECT,
      'redirectUri must be an absolute URL',
      HttpStatus.BAD_REQUEST,
    );
  }

  const isAllowed = allowedOrigins.some((origin) => {
    try {
      return new URL(origin).origin === parsed.origin;
    } catch {
      return false;
    }
  });

  if (!isAllowed) {
    throw new AppError(
      ERROR_CODES.SSO_INVALID_REDIRECT,
      'redirectUri is not an allowed origin',
      HttpStatus.BAD_REQUEST,
    );
  }
};
