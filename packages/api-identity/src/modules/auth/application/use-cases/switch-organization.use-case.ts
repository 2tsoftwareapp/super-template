import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_WRITER, type AuditWriter } from '@repo/api-core';

import { OrganizationsService } from '../../../organizations/application/organizations.service';
import { SessionTokenService } from '../services/session-token.service';

@Injectable()
export class SwitchOrganizationUseCase {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly sessionTokenService: SessionTokenService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
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
}
