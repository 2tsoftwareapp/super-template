import type { RequestContext } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { AUTH_USER_STORE, type AuthUserStore } from "@repo/feature-auth/contracts";
import { MfaService } from "@repo/feature-mfa/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";

import type { VerifyMfaChallengeCommand } from "../auth.types";

import { IssueSessionUseCase } from "./issue-session.use-case";

@Injectable()
export class CompleteMfaLoginUseCase {
  constructor(
    private readonly mfaService: MfaService,
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    private readonly issueSessionUseCase: IssueSessionUseCase,
  ) {}

  async execute(input: VerifyMfaChallengeCommand, requestContext?: RequestContext) {
    const { userId } = await this.mfaService.verifyLoginChallenge(
      input.mfaToken,
      input.code,
      {
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      },
      requestContext,
    );

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        USER_ERROR_CODES.USER_NOT_FOUND,
        "User not found",
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.issueSessionUseCase.execute(user, requestContext, {
      mustChangePassword: user.mustChangePassword,
    });
  }
}
