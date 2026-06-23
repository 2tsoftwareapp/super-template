import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { VerifyMfaChallengeCommand } from '../auth.types';

import { MfaService } from '../../../mfa/application/mfa.service';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { IssueSessionUseCase } from './issue-session.use-case';

@Injectable()
export class CompleteMfaLoginUseCase {
  constructor(
    private readonly mfaService: MfaService,
    private readonly usersRepository: UsersRepository,
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
