import type { RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, SYSTEM_SCOPE } from "@repo/api-runtime";
import { TRANSACTION_PORT } from "@repo/api-runtime";

import type { MfaRegenerateRecoveryCodesCommand } from "../mfa.types";

import { hashRecoveryCode } from "../../domain/hash-recovery-code";
import { generateRecoveryCodes } from "../../domain/recovery-codes";
import { MFA_REPOSITORY, type MfaRepositoryPort } from "../ports/mfa.repository.port";
import { MfaCodeVerifierService } from "../services/mfa-code-verifier.service";
import { AUDIT_WRITER } from "@repo/feature-audit/contracts";
import type { AuditWriter } from "@repo/feature-audit/contracts";

@Injectable()
export class RegenerateRecoveryCodesUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(MFA_REPOSITORY) private readonly mfaRepository: MfaRepositoryPort,
    private readonly mfaCodeVerifierService: MfaCodeVerifierService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: MfaRegenerateRecoveryCodesCommand,
    requestContext?: RequestContext,
  ): Promise<{ recoveryCodes: string[] }> {
    const secretRow = await this.mfaRepository.findSecretByUserId(input.userId);

    if (!secretRow?.enabled) {
      throw new AppError(
        ERROR_CODES.MFA_NOT_ENABLED,
        "Two-factor authentication is not enabled",
        HttpStatus.CONFLICT,
      );
    }

    const codeIsValid = await this.mfaCodeVerifierService.verifyCode(input.userId, input.code);

    if (!codeIsValid) {
      throw new AppError(
        ERROR_CODES.MFA_INVALID_CODE,
        "Invalid verification code",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const recoveryCodes = generateRecoveryCodes();

    await this.transactionPort.run(async (transaction) => {
      await this.mfaRepository.replaceRecoveryCodes(
        input.userId,
        recoveryCodes.map((code) => hashRecoveryCode(code)),
        transaction,
      );
      // Platform-scoped audit rows have organization_id NULL; the RLS policy
      // rejects them unless written with bypass. Write via the platform
      // transaction (bypass) like login/register do, instead of passing the
      // tenant-scoped executor.
      await this.auditWriter.log({
        actorId: input.userId,
        action: "mfa.recovery_codes_regenerated",
        entityType: "user",
        entityId: input.userId,
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      });
    });

    return { recoveryCodes };
  }
}
