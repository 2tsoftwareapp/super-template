import type { TransactionExecutor } from '@repo/api-core';

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
    executor?: TransactionExecutor,
  ): Promise<TwoFactorSecretRecord | null>;

  upsertPendingSecret(
    values: {
      userId: string;
      secretCiphertext: string;
      secretIv: string;
      secretAuthTag: string;
    },
    executor?: TransactionExecutor,
  ): Promise<TwoFactorSecretRecord | null>;

  confirmSecret(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<TwoFactorSecretRecord | null>;

  deleteSecret(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<void>;

  replaceRecoveryCodes(
    userId: string,
    codeHashes: string[],
    executor?: TransactionExecutor,
  ): Promise<void>;

  findUnusedRecoveryCodeByHash(
    userId: string,
    codeHash: string,
    executor?: TransactionExecutor,
  ): Promise<RecoveryCodeRecord | null>;

  consumeRecoveryCode(
    id: string,
    executor?: TransactionExecutor,
  ): Promise<void>;

  createChallenge(
    values: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      ipAddress: string | null;
      userAgent: string | null;
    },
    executor?: TransactionExecutor,
  ): Promise<MfaChallengeRecord | null>;

  findValidChallengeByTokenHash(
    tokenHash: string,
    executor?: TransactionExecutor,
  ): Promise<MfaChallengeRecord | null>;

  incrementChallengeAttempts(
    id: string,
    executor?: TransactionExecutor,
  ): Promise<MfaChallengeRecord | null>;

  consumeChallenge(
    id: string,
    executor?: TransactionExecutor,
  ): Promise<MfaChallengeRecord | null>;
}

export const MFA_REPOSITORY = Symbol('MFA_REPOSITORY');
