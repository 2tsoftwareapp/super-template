import type { RequestContext } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
import { AUTH_USER_STORE, type AuthUserStore } from "@repo/feature-auth/contracts";

import type { RefreshSessionCommand } from "../auth.types";
import type { AuthSessionModel } from "../models/auth-session";

import { resolveRefreshAttempt } from "../../domain/refresh-rotation.policy";
import {
  AUTH_ACCESS_PROFILE,
  type AuthAccessProfile,
} from "../../public/auth-access-profile.port";
import {
  AUTH_ORGANIZATION_CONTEXT,
  type AuthOrganizationContext,
} from "../../public/auth-organization-context.port";
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

/** Session re-reads allowed while resolving a rotation race. */
const ROTATION_MAX_ATTEMPTS = 3;

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    @Inject(AUTH_ACCESS_PROFILE)
    private readonly accessProfile: AuthAccessProfile,
    @Inject(AUTH_ORGANIZATION_CONTEXT)
    private readonly organizationContext: AuthOrganizationContext,
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

    // Reuse is decided the same way later, inside `resolveRotation` (which must
    // re-check after every re-read). Checking once here too keeps a theft
    // signal from triggering user, organization and profile lookups.
    const decision = await this.resolveAttempt(session, input.refreshToken);

    if (decision.action === "reuse") {
      throw await this.rejectAsReuse(session.id);
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

    const organizationId = await this.organizationContext.resolveOrganizationIdForUser(
      user.id,
      payload.oid,
    );

    const accessProfile = await this.accessProfile.getAccessProfile(user.id, organizationId);
    const metadata = {
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
    };

    const refreshedSession = await this.resolveRotation({
      session,
      refreshToken: input.refreshToken,
      userId: user.id,
      organizationId,
      metadata,
    });

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
   * Turns "which rotation does this refresh token belong to?" into the pair to
   * return, or into revoke + `AUTH_REFRESH_TOKEN_REUSED`:
   *
   * - `rotate` — the token is the session's current one: start a new rotation
   *   through the CAS. Losing the CAS is not the caller's fault, so we re-read
   *   the session and classify again instead of revoking.
   * - `replay` — the token is the one the current rotation consumed, inside the
   *   grace window: return that rotation's pair. N concurrent retries of one
   *   rotation therefore all succeed with the SAME tokens, and none of them
   *   leaves the others holding a dead pair (which is what used to revoke
   *   legitimate sessions a moment later).
   * - `reuse` — neither: the token was superseded long ago or belongs to
   *   another family. Revoke, exactly as before.
   */
  private async resolveRotation(input: {
    session: AuthSessionModel;
    refreshToken: string;
    userId: string;
    organizationId: string | null;
    metadata: { ipAddress: string | null; userAgent: string | null };
  }): Promise<{ accessToken: string; refreshToken: string; session: AuthSessionModel }> {
    let state = input.session;

    for (let attempt = 0; attempt < ROTATION_MAX_ATTEMPTS; attempt++) {
      const decision = await this.resolveAttempt(state, input.refreshToken);

      if (decision.action === "reuse") {
        throw await this.rejectAsReuse(state.id);
      }

      if (decision.action === "replay") {
        return this.replayRotation(state, input);
      }

      const rotated = await this.tokenProvider.tryRotateSessionTokens(
        state.id,
        state.refreshTokenHash,
        input.userId,
        input.organizationId,
        input.metadata,
      );

      if (rotated) {
        return rotated;
      }

      // CAS miss: another request rotated between our read and the write.
      // Re-read and re-classify — the presented token is very likely the one
      // that other request just consumed, i.e. a `replay` of that rotation.
      const fresh = await this.authSessionRepository.findSessionForUser(state.id, input.userId);

      if (!fresh || fresh.revokedAt) {
        throw new AppError(
          AUTH_ERROR_CODES.AUTH_SESSION_REVOKED,
          "Session has been revoked",
          HttpStatus.UNAUTHORIZED,
        );
      }

      state = fresh;
    }

    // Exhausting the re-reads means contention only — at most one CAS per
    // rotation can lose, and the winner's rotation always resolves as `replay`.
    // Never revoke on contention alone: the session is untouched, and the
    // client is told to retry instead of being logged out.
    throw new AppError(
      ERROR_CODES.RESOURCE_CONFLICT,
      "Concurrent refresh could not be resolved",
      HttpStatus.CONFLICT,
    );
  }

  /**
   * Re-issues the pair the current rotation already produced for the presented
   * token. The derived pair is compared against the session's live hash: a
   * match proves the token is the one that rotation consumed, a mismatch means
   * it is not — fail closed and treat it as reuse.
   */
  private async replayRotation(
    state: AuthSessionModel,
    input: { userId: string; organizationId: string | null },
  ): Promise<{ accessToken: string; refreshToken: string; session: AuthSessionModel }> {
    const consumedTokenHash = state.previousRefreshTokenHash;
    const rotatedAt = state.previousRotatedAt;

    if (!consumedTokenHash || !rotatedAt) {
      throw await this.rejectAsReuse(state.id);
    }

    const replayed = await this.tokenProvider.replayRotationTokens({
      sessionId: state.id,
      userId: input.userId,
      organizationId: input.organizationId,
      consumedTokenHash,
      rotatedAt,
    });

    if (replayed.refreshTokenHash !== state.refreshTokenHash) {
      // The derived pair is not the session's live pair, so this session is not
      // the one holding the tokens this rotation issued. The only inputs the
      // caller influences here are the organization (resolved from the
      // presented token) and the session/user identity: a divergence means the
      // token belongs to a different organization context than the live pair —
      // for example the user switched organization after the rotation. Fail
      // closed: deny and revoke instead of minting a pair for the wrong context.
      throw await this.rejectAsReuse(state.id);
    }

    return {
      accessToken: replayed.accessToken,
      refreshToken: replayed.refreshToken,
      session: state,
    };
  }

  /** Revokes the session and hands back the reuse error for the caller to throw. */
  private async rejectAsReuse(sessionId: string): Promise<AppError> {
    await this.authSessionRepository.revokeSession(sessionId);

    return new AppError(
      AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
      "Refresh token reuse detected",
      HttpStatus.UNAUTHORIZED,
    );
  }
}
