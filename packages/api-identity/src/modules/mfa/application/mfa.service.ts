import type { RequestContext } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  MfaChallengeMetadata,
  MfaConfirmCommand,
  MfaDisableCommand,
  MfaRegenerateRecoveryCodesCommand,
  MfaSetupResult,
} from './mfa.types';

import { ConfirmMfaUseCase } from './use-cases/confirm-mfa.use-case';
import { CreateMfaChallengeUseCase } from './use-cases/create-mfa-challenge.use-case';
import { DisableMfaUseCase } from './use-cases/disable-mfa.use-case';
import { GetMfaStatusUseCase } from './use-cases/get-mfa-status.use-case';
import { RegenerateRecoveryCodesUseCase } from './use-cases/regenerate-recovery-codes.use-case';
import { SetupMfaUseCase } from './use-cases/setup-mfa.use-case';
import { VerifyMfaChallengeUseCase } from './use-cases/verify-mfa-challenge.use-case';

@Injectable()
export class MfaService {
  constructor(
    private readonly setupMfaUseCase: SetupMfaUseCase,
    private readonly confirmMfaUseCase: ConfirmMfaUseCase,
    private readonly disableMfaUseCase: DisableMfaUseCase,
    private readonly regenerateRecoveryCodesUseCase: RegenerateRecoveryCodesUseCase,
    private readonly getMfaStatusUseCase: GetMfaStatusUseCase,
    private readonly createMfaChallengeUseCase: CreateMfaChallengeUseCase,
    private readonly verifyMfaChallengeUseCase: VerifyMfaChallengeUseCase,
  ) {}

  setup(userId: string, email: string): Promise<MfaSetupResult> {
    return this.setupMfaUseCase.execute(userId, email);
  }

  confirm(input: MfaConfirmCommand, requestContext?: RequestContext) {
    return this.confirmMfaUseCase.execute(input, requestContext);
  }

  disable(input: MfaDisableCommand, requestContext?: RequestContext) {
    return this.disableMfaUseCase.execute(input, requestContext);
  }

  regenerateRecoveryCodes(
    input: MfaRegenerateRecoveryCodesCommand,
    requestContext?: RequestContext,
  ) {
    return this.regenerateRecoveryCodesUseCase.execute(
      input,
      requestContext,
    );
  }

  getStatus(userId: string) {
    return this.getMfaStatusUseCase.execute(userId);
  }

  async isEnabled(userId: string): Promise<boolean> {
    const status = await this.getMfaStatusUseCase.execute(userId);
    return status.enabled;
  }

  createLoginChallenge(userId: string, metadata: MfaChallengeMetadata) {
    return this.createMfaChallengeUseCase.execute({ userId, metadata });
  }

  verifyLoginChallenge(
    mfaToken: string,
    code: string,
    metadata: MfaChallengeMetadata,
    requestContext?: RequestContext,
  ) {
    return this.verifyMfaChallengeUseCase.execute(
      { mfaToken, code, metadata },
      requestContext,
    );
  }
}
