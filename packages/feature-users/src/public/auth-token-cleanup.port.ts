import type { TransactionExecutor } from "@repo/api-kernel";

/**
 * Consumer-owned port: session/token lifecycle operations users and jobs need
 * from the auth domain. Implemented by feature-auth and bound through its
 * global AuthDataModule; feature-users never imports feature-auth.
 */
export interface AuthTokenCleanup {
  cleanupExpiredTokens(executor?: TransactionExecutor): Promise<void>;
  revokeAllSessionsForUser(userId: string, executor?: TransactionExecutor): Promise<void>;
}

export const AUTH_TOKEN_CLEANUP = Symbol("AUTH_TOKEN_CLEANUP");
