import type { RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE } from "@repo/api-kernel";
import { TRANSACTION_PORT } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { MFA_ERROR_CODES } from "@repo/feature-mfa/contracts";

import type { MfaConfirmCommand } from "../mfa.types";

import { hashRecoveryCode } from "../../domain/hash-recovery-code";
import { generateRecoveryCodes } from "../../domain/recovery-codes";
import { verifyTotpCode } from "../../domain/totp";
import { decryptTotpSecret } from "../../domain/totp-encryption";
import { MFA_REPOSITORY, type MfaRepositoryPort } from "../ports/mfa.repository.port";

@Injectable()
export class ConfirmMfaUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(MFA_REPOSITORY) private readonly mfaRepository: MfaRepositoryPort,
    private readonly environmentService: EnvironmentService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: MfaConfirmCommand,
    requestContext?: RequestContext,
  ): Promise<{ recoveryCodes: string[] }> {
    const secretRow = await this.mfaRepository.findSecretByUserId(input.userId);

    if (!secretRow) {
      throw new AppError(
        MFA_ERROR_CODES.MFA_SETUP_REQUIRED,
        "Start two-factor setup before confirming a code",
        HttpStatus.CONFLICT,
      );
    }

    if (secretRow.enabled) {
      throw new AppError(
        MFA_ERROR_CODES.MFA_ALREADY_ENABLED,
        "Two-factor authentication is already enabled",
        HttpStatus.CONFLICT,
      );
    }

    const secret = decryptTotpSecret(
      {
        ciphertext: secretRow.secretCiphertext,
        iv: secretRow.secretIv,
        authTag: secretRow.secretAuthTag,
      },
      this.environmentService.values.MFA_ENCRYPTION_KEY,
    );

    if (!verifyTotpCode(secret, input.code)) {
      throw new AppError(
        MFA_ERROR_CODES.MFA_INVALID_CODE,
        "Invalid verification code",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const recoveryCodes = generateRecoveryCodes();

    await this.transactionPort.run(async (transaction) => {
      await this.mfaRepository.confirmSecret(input.userId, transaction);
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
        action: "mfa.enabled",
        entityType: "user",
        entityId: input.userId,
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      });
    });

    return { recoveryCodes };
  }
}
