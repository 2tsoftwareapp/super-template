import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { durationToMilliseconds } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import { randomUUID } from "node:crypto";

import type {
  AuthTokenProviderPort,
  ReplayedRotationResult,
  ReplayRotationInput,
  TokenPayload,
} from "../application/ports/auth-token.provider.port";

import { hashRefreshToken } from "../application/auth.helpers";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../application/ports/auth-session.repository.port";
import {
  resolveRotationIdentity,
  type RotationIdentity,
} from "../domain/refresh-rotation.policy";

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
    organizationId: string | null,
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
   * The row is stamped with the hash this rotation consumed and the moment it
   * ran, which together are the rotation's identity. The pair handed out is
   * derived from that identity, so a later retry of the same rotation
   * (`replayRotationTokens`) reproduces these exact tokens instead of minting a
   * competitor that would immediately supersede them.
   */
  async tryRotateSessionTokens(
    sessionId: string,
    refreshTokenHash: string,
    userId: string,
    organizationId: string | null,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ) {
    // One clock reading for both the identity and the stored rotation time, so
    // the derived `iat` and `previousRotatedAt` can never disagree.
    const rotatedAt = new Date();
    const identity = resolveRotationIdentity({
      sessionId,
      userId,
      organizationId,
      consumedTokenHash: refreshTokenHash,
      rotatedAt,
    });

    const {
      accessToken,
      refreshToken,
      refreshTokenHash: nextRefreshTokenHash,
    } = await this.issueTokenPair(userId, sessionId, organizationId, identity);
    const session = await this.authSessionRepository.updateSessionIfMatches(
      sessionId,
      refreshTokenHash,
      {
        refreshTokenHash: nextRefreshTokenHash,
        previousRefreshTokenHash: refreshTokenHash,
        previousRotatedAt: rotatedAt,
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
   * Re-derives the pair one rotation issued, from the same identity the
   * rotating request used. Pure computation: no row is read or written, so
   * concurrent retries of one rotation cannot fight each other.
   */
  async replayRotationTokens(input: ReplayRotationInput): Promise<ReplayedRotationResult> {
    const identity = resolveRotationIdentity({
      sessionId: input.sessionId,
      userId: input.userId,
      organizationId: input.organizationId,
      consumedTokenHash: input.consumedTokenHash,
      rotatedAt: input.rotatedAt,
    });
    const { accessToken, refreshToken, refreshTokenHash } = await this.issueTokenPair(
      input.userId,
      input.sessionId,
      input.organizationId,
      identity,
    );

    return { accessToken, refreshToken, refreshTokenHash };
  }

  /**
   * Mint a fresh token pair for an existing session without presenting the
   * prior refresh token. Used by SSO exchange so plaintext tokens never need
   * to sit in `sso_session_exchanges`.
   */
  async reissueSessionTokens(
    sessionId: string,
    userId: string,
    organizationId: string | null,
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

  private async issueTokenPair(
    userId: string,
    sessionId: string,
    organizationId: string | null,
    identity?: RotationIdentity,
  ) {
    const accessToken = await this.signToken(userId, sessionId, "access", organizationId, identity);
    const refreshToken = await this.signToken(userId, sessionId, "refresh", organizationId, identity);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    return { accessToken, refreshToken, refreshTokenHash };
  }

  /**
   * When `identity` is given the token belongs to a specific rotation: its
   * `jti` and `iat` come from that identity, so signing twice for one rotation
   * yields the same token (idempotent retry). Without it the token is a
   * standalone one-off — a fresh session or an SSO re-issue.
   */
  async signToken(
    userId: string,
    sessionId: string,
    type: TokenPayload["typ"],
    organizationId: string | null,
    identity?: RotationIdentity,
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
        jti: identity
          ? type === "access"
            ? identity.accessJti
            : identity.refreshJti
          : randomUUID(),
        typ: type,
        oid: organizationId ?? undefined,
        // `exp` is derived from `iat` by the signer, so a replayed pair keeps
        // the rotation's original expiry instead of sliding forward.
        ...(identity ? { iat: identity.issuedAtSeconds } : {}),
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
