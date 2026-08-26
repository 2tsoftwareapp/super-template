import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";
import { AUTH_USER_STORE, type AuthUserStore } from "@repo/feature-auth/contracts";

import { AuthMapper } from "../auth.mapper";

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    private readonly authMapper: AuthMapper,
  ) {}

  async execute(user: AuthenticatedRequestUser) {
    const dbUser = await this.usersRepository.findById(user.userId);

    if (!dbUser) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    return {
      user: this.authMapper.toUserView(dbUser, user.roles),
      permissions: user.permissions,
      sessionId: user.sessionId,
      organizationId: user.organizationId,
      mustChangePassword: dbUser.mustChangePassword,
    };
  }
}
