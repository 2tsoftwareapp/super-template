import { Module } from '@nestjs/common';

import { MfaService } from './application/mfa.service';
import { MFA_REPOSITORY } from './application/ports/mfa.repository.port';
import { MfaCodeVerifierService } from './application/services/mfa-code-verifier.service';
import { ConfirmMfaUseCase } from './application/use-cases/confirm-mfa.use-case';
import { CreateMfaChallengeUseCase } from './application/use-cases/create-mfa-challenge.use-case';
import { DisableMfaUseCase } from './application/use-cases/disable-mfa.use-case';
import { GetMfaStatusUseCase } from './application/use-cases/get-mfa-status.use-case';
import { RegenerateRecoveryCodesUseCase } from './application/use-cases/regenerate-recovery-codes.use-case';
import { SetupMfaUseCase } from './application/use-cases/setup-mfa.use-case';
import { VerifyMfaChallengeUseCase } from './application/use-cases/verify-mfa-challenge.use-case';
import { MfaRepository } from './infrastructure/mfa.repository';
import { MfaController } from './presentation/mfa.controller';

@Module({
  controllers: [MfaController],
  providers: [
    MfaRepository,
    {
      provide: MFA_REPOSITORY,
      useExisting: MfaRepository,
    },
    MfaCodeVerifierService,
    MfaService,
    SetupMfaUseCase,
    ConfirmMfaUseCase,
    DisableMfaUseCase,
    RegenerateRecoveryCodesUseCase,
    GetMfaStatusUseCase,
    CreateMfaChallengeUseCase,
    VerifyMfaChallengeUseCase,
  ],
  exports: [MfaService],
})
export class MfaModule {}
