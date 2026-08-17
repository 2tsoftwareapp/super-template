import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { durationToMilliseconds, EnvironmentService } from "@repo/api-core";
import { randomUUID } from "node:crypto";

import type {
  AuthTokenProviderPort,
  TokenPayload,
} from "../application/ports/auth-token.provider.port";

import { hashRefreshToken } from "../application/auth.helpers";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../application/ports/auth-session.repository.port";

export { type TokenPayload };

@Injectable()
export class SessionTokenService implements AuthTokenProviderPort {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly jwtService: JwtService,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
  ) {}

  async createSessionTokens(
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ) {
    const sessionId = randomUUID();
    const expiresAt = new Date(
      Date.now() + durationToMilliseconds(this.environmentService.values.JWT_REFRESH_TTL),
    );
    const { accessToken, refreshToken, refreshTokenHash } = await this.issueTokenPair(
      userId,
      sessionId,
      organizationId,
    );
    const session = await this.authSessionRepository.createSession({
      id: sessionId,
      userId,
      refreshTokenHash,
      expiresAt,
      lastUsedAt: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    if (!session) {
      throw new Error("Session insert returned no rows");
    }

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  /**
   * CAS rotation that returns null on a hash mismatch instead of revoking.
   * The use case re-reads the session and re-classifies on CAS miss; only the
   * use case may decide to revoke.
   *
   * When `startGraceWindow` is true (strict-rotate path) the session's
   * previous-hash fields are set so that racers whose token was the old
   * current-hash can still rotate inside the grace window.  Grace-path
   * callers must NOT restart the window, so the original pre-race token
   * keeps working for later racers.
   */
  async tryRotateSessionTokens(
    sessionId: string,
    refreshTokenHash: string,
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
    options?: { startGraceWindow?: boolean },
  ) {
    const {
      accessToken,
      refreshToken,
      refreshTokenHash: nextRefreshTokenHash,
    } = await this.issueTokenPair(userId, sessionId, organizationId);
    const session = await this.authSessionRepository.updateSessionIfMatches(
      sessionId,
      refreshTokenHash,
      {
        refreshTokenHash: nextRefreshTokenHash,
        ...(options?.startGraceWindow
          ? {
              previousRefreshTokenHash: refreshTokenHash,
              previousRotatedAt: new Date(),
            }
          : {}),
        expiresAt: new Date(
          Date.now() + durationToMilliseconds(this.environmentService.values.JWT_REFRESH_TTL),
        ),
        lastUsedAt: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    );

    if (!session) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  /**
   * Mint a fresh token pair for an existing session without presenting the
   * prior refresh token. Used by SSO exchange so plaintext tokens never need
   * to sit in `sso_session_exchanges`.
   */
  async reissueSessionTokens(
    sessionId: string,
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ) {
    const {
      accessToken,
      refreshToken,
      refreshTokenHash: nextRefreshTokenHash,
    } = await this.issueTokenPair(userId, sessionId, organizationId);

    const session = await this.authSessionRepository.updateSession(sessionId, {
      refreshTokenHash: nextRefreshTokenHash,
      previousRefreshTokenHash: null,
      previousRotatedAt: null,
      expiresAt: new Date(
        Date.now() + durationToMilliseconds(this.environmentService.values.JWT_REFRESH_TTL),
      ),
      lastUsedAt: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    if (!session) {
      throw new Error("Session update returned no rows");
    }

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  private async issueTokenPair(userId: string, sessionId: string, organizationId: string) {
    const accessToken = await this.signToken(userId, sessionId, "access", organizationId);
    const refreshToken = await this.signToken(userId, sessionId, "refresh", organizationId);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    return { accessToken, refreshToken, refreshTokenHash };
  }

  async signToken(
    userId: string,
    sessionId: string,
    type: TokenPayload["typ"],
    organizationId: string,
  ) {
    const secret =
      type === "access"
        ? this.environmentService.values.JWT_ACCESS_SECRET
        : this.environmentService.values.JWT_REFRESH_SECRET;
    const expiresIn = Math.floor(
      durationToMilliseconds(
        type === "access"
          ? this.environmentService.values.JWT_ACCESS_TTL
          : this.environmentService.values.JWT_REFRESH_TTL,
      ) / 1000,
    );

    return this.jwtService.signAsync(
      {
        sub: userId,
        sid: sessionId,
        jti: randomUUID(),
        typ: type,
        oid: organizationId,
      },
      {
        secret,
        expiresIn,
      },
    );
  }

  async verifyToken(token: string, expectedType: TokenPayload["typ"]) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret:
          expectedType === "access"
            ? this.environmentService.values.JWT_ACCESS_SECRET
            : this.environmentService.values.JWT_REFRESH_SECRET,
      });

      if (payload.typ !== expectedType) {
        throw new Error("Invalid token type");
      }

      return payload;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Token is invalid or expired");
    }
  }
}
