import type { RequestContext } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { HandleSsoCallbackCommand, StartSsoLoginCommand } from './sso.types';

import { HandleSsoCallbackUseCase } from './use-cases/handle-sso-callback.use-case';
import { StartSsoLoginUseCase } from './use-cases/start-sso-login.use-case';

@Injectable()
export class SsoService {
  constructor(
    private readonly startSsoLoginUseCase: StartSsoLoginUseCase,
    private readonly handleSsoCallbackUseCase: HandleSsoCallbackUseCase,
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
}
