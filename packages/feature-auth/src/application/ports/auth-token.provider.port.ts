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

/** What one rotation issued, without touching the session row again. */
export interface ReplayedRotationResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
}

export interface ReplayRotationInput {
  sessionId: string;
  userId: string;
  organizationId: string | null;
  /** Hash of the token the rotation consumed — the session's previous hash. */
  consumedTokenHash: string;
  /** When that rotation happened — the session's previous-rotation time. */
  rotatedAt: Date;
}

export interface AuthTokenProviderPort {
  signToken(
    userId: string,
    sessionId: string,
    type: TokenPayload["typ"],
    organizationId: string | null,
  ): Promise<string>;

  verifyToken(token: string, expectedType: TokenPayload["typ"]): Promise<TokenPayload>;

  createSessionTokens(
    userId: string,
    organizationId: string | null,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    session: AuthSessionModel;
  }>;

  /**
   * Compare-and-swap rotation: replaces the session's refresh hash only while
   * it still equals `refreshTokenHash`, and records that hash plus the rotated-at
   * time as the rotation's grace slot.
   *
   * The pair is derived from the rotation identity (session, consumed hash,
   * rotated-at), so re-deriving it later with {@link replayRotationTokens}
   * yields the same tokens. Returns null on a CAS miss — only the caller may
   * decide that a miss means theft.
   */
  tryRotateSessionTokens(
    sessionId: string,
    refreshTokenHash: string,
    userId: string,
    organizationId: string | null,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ): Promise<RotateTokensResult | null>;

  /**
   * Re-issue the pair one rotation already produced, without writing anything.
   * Used for retries of that rotation: the caller must compare the returned
   * `refreshTokenHash` with the session's current hash — a match proves the
   * presented token belongs to the current rotation; a mismatch means it does
   * not, and the caller treats it as reuse.
   */
  replayRotationTokens(input: ReplayRotationInput): Promise<ReplayedRotationResult>;

  /**
   * Unconditional token re-issue for an existing session (SSO exchange).
   * Replaces the refresh hash so any tokens minted before the exchange are dead.
   */
  reissueSessionTokens(
    sessionId: string,
    userId: string,
    organizationId: string | null,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ): Promise<RotateTokensResult>;
}

export const AUTH_TOKEN_PROVIDER = Symbol("AUTH_TOKEN_PROVIDER");
