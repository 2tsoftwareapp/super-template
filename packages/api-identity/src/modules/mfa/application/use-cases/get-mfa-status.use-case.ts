import { Injectable } from '@nestjs/common';

import { MfaRepository } from '../../infrastructure/mfa.repository';

@Injectable()
export class GetMfaStatusUseCase {
  constructor(private readonly mfaRepository: MfaRepository) {}

  async execute(userId: string): Promise<{ enabled: boolean }> {
    const secretRow = await this.mfaRepository.findSecretByUserId(userId);

    return { enabled: secretRow?.enabled ?? false };
  }
}
