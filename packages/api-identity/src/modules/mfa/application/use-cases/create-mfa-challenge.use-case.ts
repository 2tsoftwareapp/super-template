import { Injectable } from '@nestjs/common';
import { durationToMilliseconds, generateOpaqueToken, hashOpaqueToken } from '@repo/api-core';

import type { MfaCreateChallengeCommand } from '../mfa.types';

import { MfaRepository } from '../../infrastructure/mfa.repository';

const CHALLENGE_TTL = '5m';

@Injectable()
export class CreateMfaChallengeUseCase {
  constructor(private readonly mfaRepository: MfaRepository) {}

  async execute(input: MfaCreateChallengeCommand): Promise<string> {
    const token = generateOpaqueToken();

    await this.mfaRepository.createChallenge({
      userId: input.userId,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + durationToMilliseconds(CHALLENGE_TTL)),
      ipAddress: input.metadata.ipAddress,
      userAgent: input.metadata.userAgent,
    });

    return token;
  }
}
