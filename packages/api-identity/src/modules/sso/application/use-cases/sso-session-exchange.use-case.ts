import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  durationToMilliseconds,
  ERROR_CODES,
  generateOpaqueToken,
  hashOpaqueToken,
} from '@repo/api-core';

import { SSO_REPOSITORY, type SsoRepositoryPort } from '../ports/sso.repository.port';

const EXCHANGE_TTL = '2m';

interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  organizationId?: string | null;
}

@Injectable()
export class CreateSsoSessionExchangeUseCase {
  constructor(@Inject(SSO_REPOSITORY) private readonly ssoRepository: SsoRepositoryPort) {}

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
  constructor(@Inject(SSO_REPOSITORY) private readonly ssoRepository: SsoRepositoryPort) {}

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
