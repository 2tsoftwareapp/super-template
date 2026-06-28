import type { RequestContext } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { HandleSsoCallbackCommand, StartSsoLoginCommand } from './sso.types';

import { HandleSsoCallbackUseCase } from './use-cases/handle-sso-callback.use-case';
import { CreateSsoSessionExchangeUseCase, ExchangeSsoSessionUseCase } from './use-cases/sso-session-exchange.use-case';
import { StartSsoLoginUseCase } from './use-cases/start-sso-login.use-case';

@Injectable()
export class SsoService {
  constructor(
    private readonly startSsoLoginUseCase: StartSsoLoginUseCase,
    private readonly handleSsoCallbackUseCase: HandleSsoCallbackUseCase,
    private readonly createSsoSessionExchangeUseCase: CreateSsoSessionExchangeUseCase,
    private readonly exchangeSsoSessionUseCase: ExchangeSsoSessionUseCase,
  ) {}

  startLogin(input: StartSsoLoginCommand) {
    return this.startSsoLoginUseCase.execute(input);
  }

  handleCallback(
    input: HandleSsoCallbackCommand,
    requestContext?: RequestContext,
  ) {
    return this.handleSsoCallbackUseCase.execute(input, requestContext);
  }

  createSessionExchange(session: {
    accessToken: string;
    refreshToken: string;
    organizationId?: string | null;
  }) {
    return this.createSsoSessionExchangeUseCase.execute(session);
  }

  exchangeSession(code: string) {
    return this.exchangeSsoSessionUseCase.execute(code);
  }
}
