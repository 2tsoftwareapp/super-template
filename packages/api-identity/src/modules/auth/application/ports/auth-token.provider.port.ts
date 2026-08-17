import type { AuthSessionModel } from "../models/auth-session";

export interface TokenPayload {
  sub: string;
  sid: string;
  jti: string;
  typ: "access" | "refresh";
  oid?: string;
}

export interface RotateTokensResult {
  accessToken: string;
  refreshToken: string;
  session: AuthSessionModel;
}

export interface AuthTokenProviderPort {
  signToken(
    userId: string,
    sessionId: string,
    type: TokenPayload["typ"],
    organizationId: string,
  ): Promise<string>;

  verifyToken(token: string, expectedType: TokenPayload["typ"]): Promise<TokenPayload>;

  createSessionTokens(
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    session: AuthSessionModel;
  }>;

  tryRotateSessionTokens(
    sessionId: string,
    refreshTokenHash: string,
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
    options?: { startGraceWindow?: boolean },
  ): Promise<RotateTokensResult | null>;

  /**
   * Unconditional token re-issue for an existing session (SSO exchange).
   * Replaces the refresh hash so any tokens minted before the exchange are dead.
   */
  reissueSessionTokens(
    sessionId: string,
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ): Promise<RotateTokensResult>;
}

export const AUTH_TOKEN_PROVIDER = Symbol("AUTH_TOKEN_PROVIDER");
