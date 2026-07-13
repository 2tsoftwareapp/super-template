import type { DatabaseExecutor } from '@repo/api-database';

export interface TwoFactorSecretRecord {
  userId: string;
  secretCiphertext: string;
  secretIv: string;
  secretAuthTag: string;
  enabled: boolean;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecoveryCodeRecord {
  id: string;
  userId: string;
  codeHash: string;
  usedAt: Date | null;
  createdAt: Date;
}

export interface MfaChallengeRecord {
  id: string;
  userId: string;
  tokenHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface MfaRepositoryPort {
  findSecretByUserId(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<TwoFactorSecretRecord | null>;

  upsertPendingSecret(
    values: {
      userId: string;
      secretCiphertext: string;
      secretIv: string;
      secretAuthTag: string;
    },
    executor?: DatabaseExecutor,
  ): Promise<TwoFactorSecretRecord | null>;

  confirmSecret(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<TwoFactorSecretRecord | null>;

  deleteSecret(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<void>;

  replaceRecoveryCodes(
    userId: string,
    codeHashes: string[],
    executor?: DatabaseExecutor,
  ): Promise<void>;

  findUnusedRecoveryCodeByHash(
    userId: string,
    codeHash: string,
    executor?: DatabaseExecutor,
  ): Promise<RecoveryCodeRecord | null>;

  consumeRecoveryCode(
    id: string,
    executor?: DatabaseExecutor,
  ): Promise<void>;

  createChallenge(
    values: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      ipAddress: string | null;
      userAgent: string | null;
    },
    executor?: DatabaseExecutor,
  ): Promise<MfaChallengeRecord | null>;

  findValidChallengeByTokenHash(
    tokenHash: string,
    executor?: DatabaseExecutor,
  ): Promise<MfaChallengeRecord | null>;

  incrementChallengeAttempts(
    id: string,
    executor?: DatabaseExecutor,
  ): Promise<MfaChallengeRecord | null>;

  consumeChallenge(
    id: string,
    executor?: DatabaseExecutor,
  ): Promise<MfaChallengeRecord | null>;
}

export const MFA_REPOSITORY = Symbol('MFA_REPOSITORY');
