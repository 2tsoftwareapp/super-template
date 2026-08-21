import type { AuthenticatedRequestUser } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-core";

import { AccessControlService } from "../../../access-control";
import { OrganizationsService } from "../../../organizations";
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from "../../../users";
import { assertSessionUsable } from "../auth.helpers";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";
import {
  AUTH_TOKEN_PROVIDER,
  type AuthTokenProviderPort,
  type TokenPayload,
} from "../ports/auth-token.provider.port";

@Injectable()
export class AuthenticateAccessTokenUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    private readonly organizationsService: OrganizationsService,
    @Inject(AUTH_TOKEN_PROVIDER)
    private readonly tokenProvider: AuthTokenProviderPort,
  ) {}

  async execute(token: string): Promise<AuthenticatedRequestUser> {
    let payload: TokenPayload;
    try {
      payload = await this.tokenProvider.verifyToken(token, "access");
    } catch {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        "Token is invalid or expired",
        HttpStatus.UNAUTHORIZED,
      );
    }
    const [session, user] = await Promise.all([
      this.authSessionRepository.findSessionForUser(payload.sid, payload.sub),
      this.usersRepository.findById(payload.sub),
    ]);

    assertSessionUsable(session);

    if (session.expiresAt <= new Date()) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_EXPIRED,
        "Session has expired",
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    if (user.status !== "ACTIVE") {
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

    return {
      userId: user.id,
      sessionId: session.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roles: accessProfile.roles,
      permissions: accessProfile.permissions,
      organizationId,
      mustChangePassword: user.mustChangePassword ?? false,
    };
  }
}
