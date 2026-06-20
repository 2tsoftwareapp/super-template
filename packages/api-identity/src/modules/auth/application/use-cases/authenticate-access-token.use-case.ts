import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { AccessControlService } from '../../../access-control/application/access-control.service';
import { OrganizationsService } from '../../../organizations/application/organizations.service';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { assertSessionUsable } from '../auth.helpers';
import { SessionTokenService } from '../services/session-token.service';

@Injectable()
export class AuthenticateAccessTokenUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly accessControlService: AccessControlService,
    private readonly organizationsService: OrganizationsService,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async execute(token: string): Promise<AuthenticatedRequestUser> {
    const payload = await this.sessionTokenService.verifyToken(token, 'access');
    const [session, user] = await Promise.all([
      this.authRepository.findSessionForUser(payload.sid, payload.sub),
      this.usersRepository.findById(payload.sub),
    ]);

    assertSessionUsable(session);

    if (session.expiresAt <= new Date()) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_EXPIRED,
        'Session has expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'The account is not active',
        HttpStatus.FORBIDDEN,
      );
    }

    const organizationId =
      await this.organizationsService.resolveOrganizationIdForUser(
        user.id,
        payload.oid,
      );
    const accessProfile = await this.accessControlService.getAccessProfile(
      user.id,
      organizationId,
    );

    return {
      userId: user.id,
      sessionId: session.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roles: accessProfile.roles,
      permissions: accessProfile.permissions,
      organizationId,
    };
  }
}
