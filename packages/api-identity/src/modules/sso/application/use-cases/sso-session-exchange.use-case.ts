import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  durationToMilliseconds,
  ERROR_CODES,
  generateOpaqueToken,
  hashOpaqueToken,
} from '@repo/api-core';

import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../../../auth/application/ports/auth-session.repository.port';
import {
  AUTH_TOKEN_PROVIDER,
  type AuthTokenProviderPort,
} from '../../../auth/application/ports/auth-token.provider.port';
import { SSO_REPOSITORY, type SsoRepositoryPort } from '../ports/sso.repository.port';

const EXCHANGE_TTL = '2m';

interface SessionExchangePayload {
  sessionId: string;
  organizationId?: string | null;
}

@Injectable()
export class CreateSsoSessionExchangeUseCase {
  constructor(@Inject(SSO_REPOSITORY) private readonly ssoRepository: SsoRepositoryPort) {}

  /**
   * Persist a one-time exchange code bound to an already-issued auth session.
   * Tokens are NOT stored — they are re-issued when the code is redeemed.
   */
  async execute(session: SessionExchangePayload): Promise<{ exchangeCode: string }> {
    const exchangeCode = generateOpaqueToken();

    await this.ssoRepository.createSessionExchange({
      codeHash: hashOpaqueToken(exchangeCode),
      sessionId: session.sessionId,
      organizationId: session.organizationId ?? null,
      expiresAt: new Date(Date.now() + durationToMilliseconds(EXCHANGE_TTL)),
    });

    return { exchangeCode };
  }
}

@Injectable()
export class ExchangeSsoSessionUseCase {
  constructor(
    @Inject(SSO_REPOSITORY) private readonly ssoRepository: SsoRepositoryPort,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUTH_TOKEN_PROVIDER)
    private readonly tokenProvider: AuthTokenProviderPort,
  ) {}

  /**
   * Redeem an exchange code: consume code, validate session, re-issue tokens.
   *
   * Flow (consume-first so the one-time code is the atomic gate):
   *   1. CAS-consume the unused, unexpired exchange by id. False → the code
   *      was already redeemed by a concurrent request — never re-issue.
   *   2. Load the bound session; reject if missing/revoked/expired.
   *   3. Re-issue access/refresh for that session (invalidates unused pre-exchange tokens).
   * Trace: CODING_RULES §12 secret-at-rest / D-001.
   */
  async execute(code: string) {
    // Step 1 — resolve the exchange, then consume it atomically. The CAS
    // consume is the gate: two racing redemptions of the same code cannot
    // both win, so a stolen code cannot mint tokens twice (TOCTOU guard).
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

    const consumed = await this.ssoRepository.consumeSessionExchange(
      exchange.id,
    );

    if (!consumed) {
      throw new AppError(
        ERROR_CODES.SSO_EXCHANGE_INVALID,
        'SSO exchange code was already used',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Step 2
    const session = await this.authSessionRepository.findSessionById(
      exchange.sessionId,
    );

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError(
        ERROR_CODES.SSO_EXCHANGE_INVALID,
        'SSO exchange session is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const organizationId = exchange.organizationId ?? '';

    // Step 3
    const tokens = await this.tokenProvider.reissueSessionTokens(
      session.id,
      session.userId,
      organizationId,
      {
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      organizationId: exchange.organizationId,
    };
  }
}
