import type { AuthenticatedRequestUser } from "@repo/api-kernel";
import type { Request } from "express";

import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiDataResponse, CurrentUser, SuccessFlagDto } from "@repo/api-runtime";

import { ConfirmMfaUseCase } from "../application/use-cases/confirm-mfa.use-case";
import { DisableMfaUseCase } from "../application/use-cases/disable-mfa.use-case";
import { GetMfaStatusUseCase } from "../application/use-cases/get-mfa-status.use-case";
import { RegenerateRecoveryCodesUseCase } from "../application/use-cases/regenerate-recovery-codes.use-case";
import { SetupMfaUseCase } from "../application/use-cases/setup-mfa.use-case";
import {
  MfaCodeDto,
  MfaRecoveryCodesResponseDto,
  MfaSetupResponseDto,
  MfaStatusDto,
} from "./dto/mfa.dto";

@ApiTags("mfa")
@ApiBearerAuth()
@Controller("auth/mfa")
export class MfaController {
  constructor(
    private readonly getMfaStatus: GetMfaStatusUseCase,
    private readonly setupMfa: SetupMfaUseCase,
    private readonly confirmMfa: ConfirmMfaUseCase,
    private readonly disableMfa: DisableMfaUseCase,
    private readonly regenerateRecoveryCodesUseCase: RegenerateRecoveryCodesUseCase,
  ) {}

  @Get("status")
  @ApiDataResponse(MfaStatusDto)
  getStatus(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.getMfaStatus.execute(user.userId);
  }

  @Post("setup")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiDataResponse(MfaSetupResponseDto, 201)
  setup(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.setupMfa.execute(user.userId, user.email);
  }

  @Post("confirm")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiDataResponse(MfaRecoveryCodesResponseDto, 201)
  confirm(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: MfaCodeDto,
    @Req() request: Request,
  ) {
    return this.confirmMfa.execute(
      { userId: user.userId, code: input.code },
      request.requestContext,
    );
  }

  @Post("disable")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiDataResponse(SuccessFlagDto, 201)
  async disable(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: MfaCodeDto,
    @Req() request: Request,
  ) {
    await this.disableMfa.execute(
      { userId: user.userId, code: input.code },
      request.requestContext,
    );

    return {
      data: {
        success: true,
      },
    };
  }

  @Post("recovery-codes/regenerate")
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiDataResponse(MfaRecoveryCodesResponseDto, 201)
  regenerateRecoveryCodes(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: MfaCodeDto,
    @Req() request: Request,
  ) {
    return this.regenerateRecoveryCodesUseCase.execute(
      { userId: user.userId, code: input.code },
      request.requestContext,
    );
  }
}
