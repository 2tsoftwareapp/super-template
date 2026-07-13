import type { DatabaseExecutor } from '@repo/api-database';

import type { AuthSessionModel, CreateSessionInput } from '../models/auth-session';

export interface AuthSessionRepositoryPort {
  createSession(
    values: CreateSessionInput,
    executor?: DatabaseExecutor,
  ): Promise<AuthSessionModel | null>;

  findSessionById(
    sessionId: string,
    executor?: DatabaseExecutor,
  ): Promise<AuthSessionModel | null>;

  findSessionForUser(
    sessionId: string,
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<AuthSessionModel | null>;

  updateSession(
    sessionId: string,
    values: Partial<CreateSessionInput>,
    executor?: DatabaseExecutor,
  ): Promise<AuthSessionModel | null>;

  updateSessionIfMatches(
    sessionId: string,
    refreshTokenHash: string,
    values: Partial<CreateSessionInput>,
    executor?: DatabaseExecutor,
  ): Promise<AuthSessionModel | null>;

  listSessionsForUser(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<AuthSessionModel[]>;

  revokeSession(
    sessionId: string,
    executor?: DatabaseExecutor,
  ): Promise<AuthSessionModel | null>;

  revokeAllSessionsForUser(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<void>;

  // Email verification tokens
  findLatestEmailVerificationToken(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<{ id: string; createdAt: Date; usedAt: Date | null } | null>;

  storeEmailVerificationToken(
    values: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
    executor?: DatabaseExecutor,
  ): Promise<{ id: string } | null>;

  findValidEmailVerificationToken(
    tokenHash: string,
    executor?: DatabaseExecutor,
  ): Promise<{ id: string; userId: string } | null>;

  consumeEmailVerificationToken(
    tokenId: string,
    executor?: DatabaseExecutor,
  ): Promise<{ id: string } | null>;

  // Password reset tokens
  storePasswordResetToken(
    values: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
    executor?: DatabaseExecutor,
  ): Promise<{ id: string } | null>;

  findValidPasswordResetToken(
    tokenHash: string,
    executor?: DatabaseExecutor,
  ): Promise<{ id: string; userId: string } | null>;

  consumePasswordResetToken(
    tokenId: string,
    executor?: DatabaseExecutor,
  ): Promise<{ id: string } | null>;

  cleanupExpiredTokens(executor?: DatabaseExecutor): Promise<void>;
}

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');
