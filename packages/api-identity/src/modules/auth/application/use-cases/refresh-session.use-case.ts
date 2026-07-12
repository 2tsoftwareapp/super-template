import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { RefreshSessionCommand } from '../auth.types';

import { AccessControlService } from '../../../access-control/application/access-control.service';
import { OrganizationsService } from '../../../organizations/application/organizations.service';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { resolveRefreshAttempt } from '../../domain/refresh-rotation.policy';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { assertSessionUsable, verifyRefreshTokenHash } from '../auth.helpers';
import { AuthMapper } from '../auth.mapper';
import { SessionTokenService } from '../services/session-token.service';

/** CAS retries for grace-path rotation racing other refreshes. */
const GRACE_ROTATION_MAX_ATTEMPTS = 3;

@Injectable()
export class RefreshSessionUseCase {
  private readonly authMapper = new AuthMapper();

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly accessControlService: AccessControlService,
    private readonly organizationsService: OrganizationsService,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async execute(input: RefreshSessionCommand, requestContext?: RequestContext) {
    const payload = await this.sessionTokenService.verifyToken(
      input.refreshToken,
      'refresh',
    );
    const session = await this.authRepository.findSessionForUser(
      payload.sid,
      payload.sub,
    );

    assertSessionUsable(session);

    if (session.expiresAt <= new Date()) {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_EXPIRED,
        'Session has expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const decision = await this.resolveAttempt(session, input.refreshToken);

    if (decision.action === 'reuse') {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
        'Refresh token reuse detected',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersRepository.findById(session.userId);

    if (user?.status !== 'ACTIVE') {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'The account is not active',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessProfile = await this.accessControlService.getAccessProfile(
      user.id,
    );
    const organizationId =
      await this.organizationsService.resolveOrganizationIdForUser(
        user.id,
        payload.oid,
      );
    const metadata = {
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
    };

    const refreshedSession =
      decision.action === 'rotate'
        ? await this.sessionTokenService.rotateSessionTokens(
            session.id,
            session.refreshTokenHash,
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
      session: this.authMapper.toSessionDto(
        refreshedSession.session,
        refreshedSession.session.id,
      ),
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
    const matchesCurrent = await verifyRefreshTokenHash(
      session.refreshTokenHash,
      refreshToken,
    );
    const matchesPrevious =
      !matchesCurrent && session.previousRefreshTokenHash
        ? await verifyRefreshTokenHash(
            session.previousRefreshTokenHash,
            refreshToken,
          )
        : false;

    return resolveRefreshAttempt({
      matchesCurrent,
      matchesPrevious,
      previousRotatedAt: session.previousRotatedAt,
    });
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
      const rotated = await this.sessionTokenService.tryRotateSessionTokens(
        sessionId,
        currentExpectedHash,
        userId,
        organizationId,
        metadata,
      );

      if (rotated) {
        return rotated;
      }

      const fresh = await this.authRepository.findSessionForUser(
        sessionId,
        userId,
      );

      if (!fresh || fresh.revokedAt) {
        break;
      }

      const decision = await this.resolveAttempt(fresh, refreshToken);

      if (decision.action === 'reuse') {
        break;
      }

      currentExpectedHash = fresh.refreshTokenHash;
    }

    await this.authRepository.revokeSession(sessionId);
    throw new AppError(
      ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
      'Refresh token reuse detected',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
