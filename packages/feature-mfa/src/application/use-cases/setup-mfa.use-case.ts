import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import { MFA_ERROR_CODES } from "@repo/feature-mfa/contracts";

import type { MfaSetupResult } from "../mfa.types";

import { base32Encode, buildOtpauthUri, generateTotpSecret } from "../../domain/totp";
import { encryptTotpSecret } from "../../domain/totp-encryption";
import { MFA_REPOSITORY, type MfaRepositoryPort } from "../ports/mfa.repository.port";

const OTPAUTH_ISSUER = "SuperTemplate";

@Injectable()
export class SetupMfaUseCase {
  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfaRepository: MfaRepositoryPort,
    private readonly environmentService: EnvironmentService,
  ) {}

  async execute(userId: string, email: string): Promise<MfaSetupResult> {
    const existing = await this.mfaRepository.findSecretByUserId(userId);

    if (existing?.enabled) {
      throw new AppError(
        MFA_ERROR_CODES.MFA_ALREADY_ENABLED,
        "Two-factor authentication is already enabled",
        HttpStatus.CONFLICT,
      );
    }

    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret, this.environmentService.values.MFA_ENCRYPTION_KEY);

    await this.mfaRepository.upsertPendingSecret({
      userId,
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      secretAuthTag: encrypted.authTag,
    });

    return {
      secret: base32Encode(secret),
      otpauthUrl: buildOtpauthUri({
        secret,
        email,
        issuer: OTPAUTH_ISSUER,
      }),
    };
  }
}
