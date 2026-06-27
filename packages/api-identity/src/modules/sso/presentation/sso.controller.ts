import type { Response } from 'express';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiDataResponse, Public } from '@repo/api-core';
import { randomUUID } from 'node:crypto';

import { SsoService } from '../application/sso.service';
import {
  SsoCallbackQueryDto,
  StartSsoLoginQueryDto,
  StartSsoLoginResponseDto,
} from './sso.dto';

@ApiTags('sso')
@Controller('auth/sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Public()
  @Get(':provider/start')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiDataResponse(StartSsoLoginResponseDto)
  startLogin(
    @Param('provider') provider: string,
    @Query() query: StartSsoLoginQueryDto,
  ) {
    return this.ssoService.startLogin({
      provider,
      redirectUri: query.redirectUri,
      ...(query.testEmail !== undefined ? { testEmail: query.testEmail } : {}),
    });
  }

  @Public()
  @Get(':provider/callback')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async handleCallbackGet(
    @Param('provider') provider: string,
    @Query() query: SsoCallbackQueryDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    await this.handleCallback(
      provider,
      query.code,
      query.state,
      request,
      response,
    );
  }

  // Apple mandates response_mode=form_post for the "email"/"name" scopes, so its
  // redirect arrives as a POST with a urlencoded body instead of a query string.
  @Public()
  @Post(':provider/callback')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async handleCallbackPost(
    @Param('provider') provider: string,
    @Body() body: SsoCallbackQueryDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    await this.handleCallback(
      provider,
      body.code,
      body.state,
      request,
      response,
    );
  }

  private wantsJsonResponse(request: Request): boolean {
    const accept = request.headers.accept ?? '';
    return accept.includes('application/json');
  }

  private async handleCallback(
    provider: string,
    code: string,
    state: string,
    request: Request,
    response: Response,
  ): Promise<void> {
    const { session, redirectUri } = await this.ssoService.handleCallback(
      { provider, code, state },
      request.requestContext,
    );

    if (this.wantsJsonResponse(request)) {
      response.status(200).json({
        data: session,
        meta: {
          requestId: request.requestContext?.requestId ?? randomUUID(),
        },
      });
      return;
    }

    const target = new URL(redirectUri);
    target.hash = new URLSearchParams({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      organizationId: session.organizationId ?? '',
    }).toString();

    response.redirect(302, target.toString());
  }
}
