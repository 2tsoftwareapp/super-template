import type { TransactionExecutor } from "../types/transaction-executor";

/**
 * Auth-owned session/token lifecycle operations consumed by other features
 * (users, jobs) without importing AuthDataModule.
 */
export interface AuthTokenCleanup {
  cleanupExpiredTokens(executor?: TransactionExecutor): Promise<void>;
  revokeAllSessionsForUser(userId: string, executor?: TransactionExecutor): Promise<void>;
}

export const AUTH_TOKEN_CLEANUP = Symbol("AUTH_TOKEN_CLEANUP");
