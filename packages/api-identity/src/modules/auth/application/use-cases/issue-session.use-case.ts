import type { RequestContext } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { UsersRepository } from '../../../users/infrastructure/users.repository';

import { AccessControlService } from '../../../access-control/application/access-control.service';
import { OrganizationsService } from '../../../organizations/application/organizations.service';
import { AuthMapper } from '../auth.mapper';
import { SessionTokenService } from '../services/session-token.service';

type AuthUser = NonNullable<
  Awaited<ReturnType<UsersRepository['findById']>>
>;

/** Shared tail of login and post-MFA-challenge flows: builds the full session response for an already-verified user. */
@Injectable()
export class IssueSessionUseCase {
  private readonly authMapper = new AuthMapper();

  constructor(
    private readonly accessControlService: AccessControlService,
    private readonly organizationsService: OrganizationsService,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async execute(user: AuthUser, requestContext?: RequestContext) {
    const organizationId =
      await this.organizationsService.resolveOrganizationIdForUser(user.id);

    const accessProfile = await this.accessControlService.getAccessProfile(
      user.id,
      organizationId,
    );

    const sessionPayload = await this.sessionTokenService.createSessionTokens(
      user.id,
      organizationId,
      {
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      },
    );

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
