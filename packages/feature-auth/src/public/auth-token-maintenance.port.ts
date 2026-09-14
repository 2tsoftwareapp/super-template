import type { TransactionExecutor } from "@repo/api-kernel";

/**
 * Auth-owned session/token lifecycle operations consumed by auth's own job
 * handlers and seeders.
 */
export interface AuthTokenMaintenance {
  cleanupExpiredTokens(executor?: TransactionExecutor): Promise<void>;
  revokeAllSessionsForUser(userId: string, executor?: TransactionExecutor): Promise<void>;
}

export { AUTH_TOKEN_MAINTENANCE } from "./auth-token-maintenance.token";
