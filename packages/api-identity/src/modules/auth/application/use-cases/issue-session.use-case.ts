import type { RequestContext } from "@repo/api-core";

import { Inject, Injectable } from "@nestjs/common";

import type { AuthUserModel } from "../models/auth-user";

import { AccessControlService } from "../../../access-control";
import { OrganizationsService } from "../../../organizations";
import { AuthMapper } from "../auth.mapper";
import { AUTH_TOKEN_PROVIDER, type AuthTokenProviderPort } from "../ports/auth-token.provider.port";

/** Shared tail of login and post-MFA-challenge flows: builds the full session response for an already-verified user. */
@Injectable()
export class IssueSessionUseCase {
  constructor(
    private readonly accessControlService: AccessControlService,
    private readonly organizationsService: OrganizationsService,
    @Inject(AUTH_TOKEN_PROVIDER)
    private readonly tokenProvider: AuthTokenProviderPort,
    private readonly authMapper: AuthMapper,
  ) {}

  async execute(
    user: AuthUserModel,
    requestContext?: RequestContext,
    options?: { mustChangePassword?: boolean },
  ) {
    const organizationId = await this.organizationsService.resolveOrganizationIdForUser(user.id);

    const accessProfile = await this.accessControlService.getAccessProfile(user.id, organizationId);

    const sessionPayload = await this.tokenProvider.createSessionTokens(user.id, organizationId, {
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
    });

    return {
      accessToken: sessionPayload.accessToken,
      refreshToken: sessionPayload.refreshToken,
      user: this.authMapper.toUserView(user, accessProfile.roles),
      permissions: accessProfile.permissions,
      organizationId,
      mustChangePassword: options?.mustChangePassword ?? false,
      session: this.authMapper.toSessionDto(sessionPayload.session, sessionPayload.session.id),
    };
  }
}
