import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { VerifyMfaChallengeCommand } from '../auth.types';

import { MfaService } from '../../../mfa/application/mfa.service';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../../../users/application/ports/users.repository.port';
import { IssueSessionUseCase } from './issue-session.use-case';

@Injectable()
export class CompleteMfaLoginUseCase {
  constructor(
    private readonly mfaService: MfaService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly issueSessionUseCase: IssueSessionUseCase,
  ) {}

  async execute(
    input: VerifyMfaChallengeCommand,
    requestContext?: RequestContext,
  ) {
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
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.issueSessionUseCase.execute(user, requestContext);
  }
}
