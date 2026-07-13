import { Inject, Injectable } from '@nestjs/common';

import { MFA_REPOSITORY, type MfaRepositoryPort } from '../ports/mfa.repository.port';

@Injectable()
export class GetMfaStatusUseCase {
  constructor(@Inject(MFA_REPOSITORY) private readonly mfaRepository: MfaRepositoryPort) {}

  async execute(userId: string): Promise<{ enabled: boolean }> {
    const secretRow = await this.mfaRepository.findSecretByUserId(userId);

    return { enabled: secretRow?.enabled ?? false };
  }
}
