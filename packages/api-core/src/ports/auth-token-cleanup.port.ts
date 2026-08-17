export interface AuthTokenCleanup {
  cleanupExpiredTokens(): Promise<void>;
}

export const AUTH_TOKEN_CLEANUP = Symbol("AUTH_TOKEN_CLEANUP");
