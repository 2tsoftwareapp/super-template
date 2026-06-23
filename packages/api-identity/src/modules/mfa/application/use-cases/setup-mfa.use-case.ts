import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, EnvironmentService, ERROR_CODES } from '@repo/api-core';

import type { MfaSetupResult } from '../mfa.types';

import {
  base32Encode,
  buildOtpauthUri,
  generateTotpSecret,
} from '../../domain/totp';
import { encryptTotpSecret } from '../../domain/totp-encryption';
import { MfaRepository } from '../../infrastructure/mfa.repository';

const OTPAUTH_ISSUER = 'SuperTemplate';

@Injectable()
export class SetupMfaUseCase {
  constructor(
    private readonly mfaRepository: MfaRepository,
    private readonly environmentService: EnvironmentService,
  ) {}

  async execute(userId: string, email: string): Promise<MfaSetupResult> {
    const existing = await this.mfaRepository.findSecretByUserId(userId);

    if (existing?.enabled) {
      throw new AppError(
        ERROR_CODES.MFA_ALREADY_ENABLED,
        'Two-factor authentication is already enabled',
        HttpStatus.CONFLICT,
      );
    }

    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(
      secret,
      this.environmentService.values.MFA_ENCRYPTION_KEY,
    );

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
