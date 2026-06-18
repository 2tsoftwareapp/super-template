import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  normalizeEmail,
} from '@repo/api-core';

import type { LoginDto } from '../presentation/auth.dto';

import { AccessControlService } from '../../access-control/application/access-control.service';
import { OrganizationsService } from '../../organizations/application/organizations.service';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { verifyPasswordWithTimingPadding } from './auth.helpers';
import { AuthMapper } from './auth.mapper';
import { SessionTokenService } from './session-token.service';

@Injectable()
export class LoginUseCase {
  private readonly authMapper = new AuthMapper();

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly organizationsService: OrganizationsService,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async execute(input: LoginDto, requestContext?: RequestContext) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);
    const passwordMatches = await verifyPasswordWithTimingPadding(
      user?.passwordHash,
      input.password,
    );

    if (!user || !passwordMatches) {
      await this.auditWriter.log({
        ...(user ? { actorId: user.id, entityId: user.id } : {}),
        action: 'auth.login.failed',
        entityType: 'user',
        metadata: { email },
        requestContext,
      });
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === 'BLOCKED') {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'Your account is blocked',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.status === 'PENDING' || !user.emailVerifiedAt) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'Verify your email before logging in',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessProfile = await this.accessControlService.getAccessProfile(
      user.id,
    );
    const organizationId =
      await this.organizationsService.resolveOrganizationIdForUser(user.id);
    const sessionPayload = await this.sessionTokenService.createSessionTokens(
      user.id,
      organizationId,
      {
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      },
    );

    await this.auditWriter.log({
      actorId: user.id,
      action: 'auth.login.succeeded',
      entityType: 'user',
      entityId: user.id,
      requestContext,
    });

    return {
      accessToken: sessionPayload.accessToken,
      refreshToken: sessionPayload.refreshToken,
      user: this.authMapper.toUserView(user, accessProfile.roles),
      permissions: accessProfile.permissions,
      organizationId,
      session: this.authMapper.toSessionDto(
        sessionPayload.session,
        sessionPayload.session.id,
      ),
    };
  }
}
