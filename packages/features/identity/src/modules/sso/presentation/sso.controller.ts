import type { Response } from "express";
import type { Request } from "express";

import { Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiDataResponse, Public } from "@repo/api-core";
import { randomUUID } from "node:crypto";

import { HandleSsoCallbackUseCase } from "../application/use-cases/handle-sso-callback.use-case";
import {
  CreateSsoSessionExchangeUseCase,
  ExchangeSsoSessionUseCase,
} from "../application/use-cases/sso-session-exchange.use-case";
import { StartSsoLoginUseCase } from "../application/use-cases/start-sso-login.use-case";
import {
  ExchangeSsoSessionDto,
  SsoCallbackQueryDto,
  StartSsoLoginQueryDto,
  StartSsoLoginResponseDto,
} from "./sso.dto";

@ApiTags("sso")
@Controller("auth/sso")
export class SsoController {
  constructor(
    private readonly startSsoLogin: StartSsoLoginUseCase,
    private readonly handleSsoCallback: HandleSsoCallbackUseCase,
    private readonly createSsoSessionExchange: CreateSsoSessionExchangeUseCase,
    private readonly exchangeSsoSession: ExchangeSsoSessionUseCase,
  ) {}

  @Public()
  @Get(":provider/start")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiDataResponse(StartSsoLoginResponseDto)
  startLogin(@Param("provider") provider: string, @Query() query: StartSsoLoginQueryDto) {
    return this.startSsoLogin.execute({
      provider,
      redirectUri: query.redirectUri,
      ...(query.testEmail !== undefined ? { testEmail: query.testEmail } : {}),
    });
  }

  @Public()
  @Post("exchange")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  exchangeSession(@Body() body: ExchangeSsoSessionDto) {
    return this.exchangeSsoSession.execute(body.code);
  }

  @Public()
  @Get(":provider/callback")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async handleCallbackGet(
    @Param("provider") provider: string,
    @Query() query: SsoCallbackQueryDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    await this.handleCallback(provider, query.code, query.state, request, response);
  }

  // Apple mandates response_mode=form_post for the "email"/"name" scopes, so its
  // redirect arrives as a POST with a urlencoded body instead of a query string.
  @Public()
  @Post(":provider/callback")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async handleCallbackPost(
    @Param("provider") provider: string,
    @Body() body: SsoCallbackQueryDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    await this.handleCallback(provider, body.code, body.state, request, response);
  }

  private wantsJsonResponse(request: Request): boolean {
    const accept = request.headers.accept ?? "";
    return accept.includes("application/json");
  }

  private async handleCallback(
    provider: string,
    code: string,
    state: string,
    request: Request,
    response: Response,
  ): Promise<void> {
    const { session, redirectUri } = await this.handleSsoCallback.execute(
      { provider, code, state },
      request.requestContext,
    );

    const { exchangeCode } = await this.createSsoSessionExchange.execute({
      sessionId: session.session.id,
      organizationId: session.organizationId,
    });

    if (this.wantsJsonResponse(request)) {
      response.status(200).json({
        data: {
          exchangeCode,
          redirectUri,
        },
        meta: {
          requestId: request.requestContext?.requestId ?? randomUUID(),
        },
      });
      return;
    }

    const target = new URL(redirectUri);
    target.searchParams.set("exchange", exchangeCode);
    response.redirect(302, target.toString());
  }
}
