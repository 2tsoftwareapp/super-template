import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import { OrganizationsService } from '../../organizations/application/organizations.service';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { AuthRepository } from '../infrastructure/auth.repository';
import { AuthMapper } from './auth.mapper';
import { SessionTokenService } from './session-token.service';

@Injectable()
export class SessionManagementUseCase {
  private readonly authMapper = new AuthMapper();

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly organizationsService: OrganizationsService,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async switchOrganization(
    user: AuthenticatedRequestUser,
    organizationId: string,
    requestContext?: RequestContext,
  ) {
    await this.organizationsService.assertMembership(
      organizationId,
      user.userId,
    );

    const accessToken = await this.sessionTokenService.signToken(
      user.userId,
      user.sessionId,
      'access',
      organizationId,
    );

    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.organization.switched',
      entityType: 'organization',
      entityId: organizationId,
      requestContext,
    });

    return {
      data: {
        accessToken,
        organizationId,
      },
    };
  }

  async logout(
    user: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    await this.authRepository.revokeSession(user.sessionId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.logout',
      entityType: 'session',
      entityId: user.sessionId,
      requestContext,
    });
  }

  async logoutAll(
    user: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    await this.authRepository.revokeAllSessionsForUser(user.userId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.logout_all',
      entityType: 'user',
      entityId: user.userId,
      requestContext,
    });
  }

  async getMe(user: AuthenticatedRequestUser) {
    const dbUser = await this.usersRepository.findById(user.userId);

    if (!dbUser) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      user: this.authMapper.toUserView(dbUser, user.roles),
      permissions: user.permissions,
      sessionId: user.sessionId,
      organizationId: user.organizationId,
    };
  }

  async getSessions(user: AuthenticatedRequestUser) {
    const sessions = await this.authRepository.listSessionsForUser(user.userId);
    return sessions.map((session) =>
      this.authMapper.toSessionDto(session, user.sessionId),
    );
  }

  async revokeSession(
    user: AuthenticatedRequestUser,
    sessionId: string,
    requestContext?: RequestContext,
  ) {
    const session = await this.authRepository.findSessionForUser(
      sessionId,
      user.userId,
    );

    if (!session) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.authRepository.revokeSession(sessionId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.session.revoked',
      entityType: 'session',
      entityId: sessionId,
      requestContext,
    });
  }
}
