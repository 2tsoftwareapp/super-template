import { AppError } from "@repo/api-kernel";

import { SSO_ERROR_CODES } from "../public/error-codes";

const normalizeRedirectUri = (redirectUri: string): string => {
  const parsed = new URL(redirectUri);

  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  }

  return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
};

export const assertAllowedRedirectUri = (
  redirectUri: string,
  allowedOrigins: string[],
  allowedExactUris: string[] = [],
): void => {
  let parsed: URL;

  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new AppError(
      SSO_ERROR_CODES.SSO_INVALID_REDIRECT,
      "redirectUri must be an absolute URL",
      400,
    );
  }

  const normalized = normalizeRedirectUri(redirectUri);

  if (allowedExactUris.some((uri) => normalizeRedirectUri(uri) === normalized)) {
    return;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError(
      SSO_ERROR_CODES.SSO_INVALID_REDIRECT,
      "redirectUri is not an allowed origin",
      400,
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
      SSO_ERROR_CODES.SSO_INVALID_REDIRECT,
      "redirectUri is not an allowed origin",
      400,
    );
  }
};
