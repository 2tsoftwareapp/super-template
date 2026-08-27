import { HttpStatus } from "@nestjs/common";
import {AppError, generateOpaqueToken, hashOpaqueToken } from "@repo/api-runtime";
import { hashPassword, hashRefreshToken, verifyPassword, verifyPasswordWithTimingPadding, verifyRefreshTokenHash } from "@repo/utils/password";

import type { AuthSessionModel } from "./models/auth-session";

export function assertSessionUsable(
  session: AuthSessionModel | null,
): asserts session is AuthSessionModel {
  if (!session) {
    throw new AppError(
      AUTH_ERROR_CODES.AUTH_SESSION_REVOKED,
      "Session not found",
      HttpStatus.UNAUTHORIZED,
    );
  }

  if (session.revokedAt) {
    throw new AppError(
      AUTH_ERROR_CODES.AUTH_SESSION_REVOKED,
      "Session has been revoked",
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export {
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  hashRefreshToken,
  verifyPassword,
  verifyPasswordWithTimingPadding,
  verifyRefreshTokenHash,
};

import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
