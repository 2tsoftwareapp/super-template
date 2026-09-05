import type { TransactionExecutor } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-runtime";

import { hashRecoveryCode } from "../../domain/hash-recovery-code";
import { normalizeRecoveryCode } from "../../domain/recovery-codes";
import { verifyTotpCode } from "../../domain/totp";
import { decryptTotpSecret } from "../../domain/totp-encryption";
import { MFA_REPOSITORY, type MfaRepositoryPort } from "../ports/mfa.repository.port";

const RECOVERY_CODE_LENGTH = 8;

@Injectable()
export class MfaCodeVerifierService {
  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfaRepository: MfaRepositoryPort,
    private readonly environmentService: EnvironmentService,
  ) {}

  /** Accepts either a 6-digit TOTP code or an unused recovery code, consuming the latter on success. */
  async verifyCode(userId: string, code: string, executor?: TransactionExecutor): Promise<boolean> {
    const secretRow = await this.mfaRepository.findSecretByUserId(userId, executor);

    if (!secretRow) {
      return false;
    }

    const secret = decryptTotpSecret(
      {
        ciphertext: secretRow.secretCiphertext,
        iv: secretRow.secretIv,
        authTag: secretRow.secretAuthTag,
      },
      this.environmentService.values.MFA_ENCRYPTION_KEY,
    );

    if (verifyTotpCode(secret, code)) {
      return true;
    }

    const normalized = normalizeRecoveryCode(code);

    if (normalized.length !== RECOVERY_CODE_LENGTH) {
      return false;
    }

    const recoveryCode = await this.mfaRepository.findUnusedRecoveryCodeByHash(
      userId,
      hashRecoveryCode(normalized),
      executor,
    );

    if (!recoveryCode) {
      return false;
    }

    // CAS-consume: only the first concurrent request wins the row. A false
    // result means another request already used this recovery code — the code
    // must not authenticate a second time (TOCTOU guard).
    return this.mfaRepository.consumeRecoveryCode(recoveryCode.id, executor);
  }
}
