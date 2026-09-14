import type { RequestContext } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";

import type { SessionIssuanceOptions, SessionIssuanceUser } from "../../public/session-issuer.port";

import { AUTH_ACCESS_PROFILE, type AuthAccessProfile } from "../../public/auth-access-profile.port";
import {
  AUTH_ORGANIZATION_CONTEXT,
  type AuthOrganizationContext,
} from "../../public/auth-organization-context.port";
import { AuthMapper } from "../auth.mapper";
import { AUTH_TOKEN_PROVIDER, type AuthTokenProviderPort } from "../ports/auth-token.provider.port";

/** Shared tail of login and post-MFA-challenge flows: builds the full session response for an already-verified user. */
@Injectable()
export class IssueSessionUseCase {
  constructor(
    @Inject(AUTH_ACCESS_PROFILE)
    private readonly accessProfilePort: AuthAccessProfile,
    @Inject(AUTH_ORGANIZATION_CONTEXT)
    private readonly organizationContext: AuthOrganizationContext,
    @Inject(AUTH_TOKEN_PROVIDER)
    private readonly tokenProvider: AuthTokenProviderPort,
    private readonly authMapper: AuthMapper,
  ) {}

  async execute(
    user: SessionIssuanceUser,
    requestContext?: RequestContext,
    options?: SessionIssuanceOptions,
  ) {
    const organizationId = await this.organizationContext.resolveOrganizationIdForUser(user.id);

    const accessProfile = await this.accessProfilePort.getAccessProfile(user.id, organizationId);

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
