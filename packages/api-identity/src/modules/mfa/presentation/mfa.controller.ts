import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse, CurrentUser, SuccessFlagDto } from '@repo/api-core';

import { MfaService } from '../application/mfa.service';
import {
  MfaCodeDto,
  MfaRecoveryCodesResponseDto,
  MfaSetupResponseDto,
  MfaStatusDto,
} from './mfa.dto';

@ApiTags('mfa')
@ApiBearerAuth()
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('status')
  @ApiDataResponse(MfaStatusDto)
  getStatus(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.mfaService.getStatus(user.userId);
  }

  @Post('setup')
  @ApiDataResponse(MfaSetupResponseDto, 201)
  setup(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.mfaService.setup(user.userId, user.email);
  }

  @Post('confirm')
  @ApiDataResponse(MfaRecoveryCodesResponseDto, 201)
  confirm(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: MfaCodeDto,
    @Req() request: Request,
  ) {
    return this.mfaService.confirm(
      { userId: user.userId, code: input.code },
      request.requestContext,
    );
  }

  @Post('disable')
  @ApiDataResponse(SuccessFlagDto, 201)
  async disable(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: MfaCodeDto,
    @Req() request: Request,
  ) {
    await this.mfaService.disable(
      { userId: user.userId, code: input.code },
      request.requestContext,
    );

    return {
      data: {
        success: true,
      },
    };
  }

  @Post('recovery-codes/regenerate')
  @ApiDataResponse(MfaRecoveryCodesResponseDto, 201)
  regenerateRecoveryCodes(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: MfaCodeDto,
    @Req() request: Request,
  ) {
    return this.mfaService.regenerateRecoveryCodes(
      { userId: user.userId, code: input.code },
      request.requestContext,
    );
  }
}
