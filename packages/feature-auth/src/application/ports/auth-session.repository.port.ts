import type { TransactionExecutor } from "@repo/api-kernel";

import type { AuthSessionModel, CreateSessionInput } from "../models/auth-session";

export interface AuthSessionRepositoryPort {
  createSession(
    values: CreateSessionInput,
    executor?: TransactionExecutor,
  ): Promise<AuthSessionModel | null>;

  findSessionById(
    sessionId: string,
    executor?: TransactionExecutor,
  ): Promise<AuthSessionModel | null>;

  findSessionForUser(
    sessionId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<AuthSessionModel | null>;

  updateSession(
    sessionId: string,
    values: Partial<
      CreateSessionInput & {
        previousRefreshTokenHash: string | null;
        previousRotatedAt: Date | null;
        revokedAt: Date | null;
      }
    >,
    executor?: TransactionExecutor,
  ): Promise<AuthSessionModel | null>;

  updateSessionIfMatches(
    sessionId: string,
    refreshTokenHash: string,
    values: Partial<
      CreateSessionInput & {
        previousRefreshTokenHash: string | null;
        previousRotatedAt: Date | null;
      }
    >,
    executor?: TransactionExecutor,
  ): Promise<AuthSessionModel | null>;

  listSessionsForUser(userId: string, executor?: TransactionExecutor): Promise<AuthSessionModel[]>;

  revokeSession(
    sessionId: string,
    executor?: TransactionExecutor,
  ): Promise<AuthSessionModel | null>;

  revokeAllSessionsForUser(userId: string, executor?: TransactionExecutor): Promise<void>;

  // Email verification tokens
  findLatestEmailVerificationToken(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<{ id: string; createdAt: Date; usedAt: Date | null } | null>;

  storeEmailVerificationToken(
    values: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
    executor?: TransactionExecutor,
  ): Promise<{ id: string } | null>;

  findValidEmailVerificationToken(
    tokenHash: string,
    executor?: TransactionExecutor,
  ): Promise<{ id: string; userId: string } | null>;

  consumeEmailVerificationToken(
    tokenId: string,
    executor?: TransactionExecutor,
  ): Promise<{ id: string } | null>;

  // Password reset tokens
  storePasswordResetToken(
    values: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
    executor?: TransactionExecutor,
  ): Promise<{ id: string } | null>;

  findValidPasswordResetToken(
    tokenHash: string,
    executor?: TransactionExecutor,
  ): Promise<{ id: string; userId: string } | null>;

  consumePasswordResetToken(
    tokenId: string,
    executor?: TransactionExecutor,
  ): Promise<{ id: string } | null>;

  cleanupExpiredTokens(executor?: TransactionExecutor): Promise<void>;
}

export const AUTH_SESSION_REPOSITORY = Symbol("AUTH_SESSION_REPOSITORY");
