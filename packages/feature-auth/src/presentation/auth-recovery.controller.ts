import type { Request } from "express";

import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiDataResponse, SuccessFlagDto, SuccessMessageDto } from "@repo/api-runtime";
import { Public } from "@repo/api-runtime";

import { ForgotPasswordUseCase } from "../application/use-cases/forgot-password.use-case";
import { ResetPasswordUseCase } from "../application/use-cases/reset-password.use-case";
import { ForgotPasswordDto, ResetPasswordDto } from "./dto/password-recovery.dto";

@ApiTags("auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthRecoveryController {
  constructor(
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Public()
  @Post("forgot-password")
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessMessageDto, 201)
  async forgotPassword(@Body() input: ForgotPasswordDto) {
    const result = await this.forgotPasswordUseCase.execute({ email: input.email });

    return { data: result };
  }

  @Public()
  @Post("reset-password")
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessFlagDto, 201)
  async resetPassword(@Body() input: ResetPasswordDto, @Req() request: Request) {
    const result = await this.resetPasswordUseCase.execute(
      {
        token: input.token,
        newPassword: input.newPassword,
      },
      request.requestContext,
    );

    return { data: result };
  }
}
