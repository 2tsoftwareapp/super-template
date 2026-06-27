import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AppError,
  durationToMilliseconds,
  ERROR_CODES,
  generateOpaqueToken,
  hashOpaqueToken,
} from '@repo/api-core';

import { SsoRepository } from '../../infrastructure/sso.repository';

const EXCHANGE_TTL = '2m';

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  organizationId?: string | null;
};

@Injectable()
export class CreateSsoSessionExchangeUseCase {
  constructor(private readonly ssoRepository: SsoRepository) {}

  async execute(session: SessionPayload): Promise<{ exchangeCode: string }> {
    const exchangeCode = generateOpaqueToken();

    await this.ssoRepository.createSessionExchange({
      codeHash: hashOpaqueToken(exchangeCode),
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      organizationId: session.organizationId ?? null,
      expiresAt: new Date(Date.now() + durationToMilliseconds(EXCHANGE_TTL)),
    });

    return { exchangeCode };
  }
}

@Injectable()
export class ExchangeSsoSessionUseCase {
  constructor(private readonly ssoRepository: SsoRepository) {}

  async execute(code: string) {
    const exchange = await this.ssoRepository.findValidSessionExchangeByCodeHash(
      hashOpaqueToken(code),
    );

    if (!exchange) {
      throw new AppError(
        ERROR_CODES.SSO_EXCHANGE_INVALID,
        'SSO exchange code is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.ssoRepository.consumeSessionExchange(exchange.id);

    return {
      accessToken: exchange.accessToken,
      refreshToken: exchange.refreshToken,
      organizationId: exchange.organizationId,
    };
  }
}
