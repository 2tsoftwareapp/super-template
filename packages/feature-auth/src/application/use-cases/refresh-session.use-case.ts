import type { RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {AppError } from "@repo/api-runtime";
import { AccessControlService } from "@repo/feature-access-control/contracts";
import { AUTH_USER_STORE, type AuthUserStore } from "@repo/feature-auth/contracts";
import { OrganizationsService } from "@repo/feature-organizations/contracts";

import type { RefreshSessionCommand } from "../auth.types";

import { resolveRefreshAttempt } from "../../domain/refresh-rotation.policy";
import { assertSessionUsable, verifyRefreshTokenHash } from "../auth.helpers";
import { AuthMapper } from "../auth.mapper";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";
import {
  AUTH_TOKEN_PROVIDER,
  type AuthTokenProviderPort,
  type TokenPayload,
} from "../ports/auth-token.provider.port";

/** CAS retries for grace-path rotation racing other refreshes. */
const GRACE_ROTATION_MAX_ATTEMPTS = 3;

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    private readonly accessControlService: AccessControlService,
    private readonly organizationsService: OrganizationsService,
    @Inject(AUTH_TOKEN_PROVIDER)
    private readonly tokenProvider: AuthTokenProviderPort,
    private readonly authMapper: AuthMapper,
  ) {}

  async execute(input: RefreshSessionCommand, requestContext?: RequestContext) {
    let payload: TokenPayload;
    try {
      payload = await this.tokenProvider.verifyToken(input.refreshToken, "refresh");
    } catch {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        "Token is invalid or expired",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const session = await this.authSessionRepository.findSessionForUser(payload.sid, payload.sub);

    assertSessionUsable(session);

    if (session.expiresAt <= new Date()) {
      await this.authSessionRepository.revokeSession(session.id);
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_SESSION_EXPIRED,
        "Session has expired",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const decision = await this.resolveAttempt(session, input.refreshToken);

    if (decision.action === "reuse") {
      await this.authSessionRepository.revokeSession(session.id);
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
        "Refresh token reuse detected",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersRepository.findById(session.userId);

    if (user?.status !== "ACTIVE") {
      await this.authSessionRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "The account is not active",
        HttpStatus.FORBIDDEN,
      );
    }

    const organizationId = await this.organizationsService.resolveOrganizationIdForUser(
      user.id,
      payload.oid,
    );

    const accessProfile = await this.accessControlService.getAccessProfile(user.id, organizationId);
    const metadata = {
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
    };

    const refreshedSession =
      decision.action === "rotate"
        ? await this.rotateWithStrictFallback(
            session.id,
            session.refreshTokenHash,
            input.refreshToken,
            user.id,
            organizationId,
            metadata,
          )
        : await this.rotateWithGrace(
            session.id,
            session.refreshTokenHash,
            input.refreshToken,
            user.id,
            organizationId,
            metadata,
          );

    return {
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken,
      user: this.authMapper.toUserView(user, accessProfile.roles),
      permissions: accessProfile.permissions,
      organizationId,
      session: this.authMapper.toSessionDto(refreshedSession.session, refreshedSession.session.id),
    };
  }

  private async resolveAttempt(
    session: {
      refreshTokenHash: string;
      previousRefreshTokenHash: string | null;
      previousRotatedAt: Date | null;
    },
    refreshToken: string,
  ) {
    const matchesCurrent = await verifyRefreshTokenHash(session.refreshTokenHash, refreshToken);
    const matchesPrevious =
      !matchesCurrent && session.previousRefreshTokenHash
        ? await verifyRefreshTokenHash(session.previousRefreshTokenHash, refreshToken)
        : false;

    return resolveRefreshAttempt({
      matchesCurrent,
      matchesPrevious,
      previousRotatedAt: session.previousRotatedAt,
    });
  }

  /**
   * Strict-rotation path with CAS-miss fallback: if another request already
   * rotated from the same current hash, re-read the session and re-classify.
   * Only revoke if the token is outside the grace window (actual reuse).
   */
  private async rotateWithStrictFallback(
    sessionId: string,
    expectedHash: string,
    refreshToken: string,
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ) {
    const rotated = await this.tokenProvider.tryRotateSessionTokens(
      sessionId,
      expectedHash,
      userId,
      organizationId,
      metadata,
      { startGraceWindow: true },
    );

    if (rotated) {
      return rotated;
    }

    // CAS miss — another request rotated first. Re-read session and classify
    // the caller's token against the new state.
    const fresh = await this.authSessionRepository.findSessionForUser(sessionId, userId);

    if (!fresh || fresh.revokedAt) {
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_SESSION_REVOKED,
        "Session has been revoked",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const fallbackDecision = await this.resolveAttempt(fresh, refreshToken);

    if (fallbackDecision.action === "reuse") {
      await this.authSessionRepository.revokeSession(sessionId);
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
        "Refresh token reuse detected",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Token is still the current or previous hash — retry through the
    // grace path (which handles further races).
    return this.rotateWithGrace(
      sessionId,
      fresh.refreshTokenHash,
      refreshToken,
      userId,
      organizationId,
      metadata,
    );
  }

  /**
   * Grace-path rotation: the caller holds the previous token, so other racers
   * may rotate the current hash underneath us. Retry the CAS against a fresh
   * read; every retry re-validates that the token is still inside the grace
   * window before rotating.
   */
  private async rotateWithGrace(
    sessionId: string,
    expectedHash: string,
    refreshToken: string,
    userId: string,
    organizationId: string,
    metadata: { ipAddress: string | null; userAgent: string | null },
  ) {
    let currentExpectedHash = expectedHash;

    for (let attempt = 0; attempt < GRACE_ROTATION_MAX_ATTEMPTS; attempt++) {
      const rotated = await this.tokenProvider.tryRotateSessionTokens(
        sessionId,
        currentExpectedHash,
        userId,
        organizationId,
        metadata,
      );

      if (rotated) {
        return rotated;
      }

      const fresh = await this.authSessionRepository.findSessionForUser(sessionId, userId);

      if (!fresh || fresh.revokedAt) {
        break;
      }

      const decision = await this.resolveAttempt(fresh, refreshToken);

      if (decision.action === "reuse") {
        break;
      }

      currentExpectedHash = fresh.refreshTokenHash;
    }

    await this.authSessionRepository.revokeSession(sessionId);
    throw new AppError(
      AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
      "Refresh token reuse detected",
      HttpStatus.UNAUTHORIZED,
    );
  }
}

import { ERROR_CODES } from "@repo/api-runtime";
import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
