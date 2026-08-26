import type { Request } from "express";

import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiDataResponse, SuccessFlagDto, SuccessMessageDto } from "@repo/api-runtime";
import { Public } from "@repo/api-runtime";

import { RegisterUseCase } from "../application/use-cases/register.use-case";
import { ResendVerificationUseCase } from "../application/use-cases/resend-verification.use-case";
import { VerifyEmailUseCase } from "../application/use-cases/verify-email.use-case";
import { RegisterDto, ResendVerificationDto, VerifyEmailDto } from "./dto/register.dto";

@ApiTags("auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthRegistrationController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
  ) {}

  @Public()
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiDataResponse(SuccessMessageDto, 201)
  async register(@Body() input: RegisterDto, @Req() request: Request) {
    const result = await this.registerUseCase.execute(
      {
        email: input.email,
        password: input.password,
        displayName: input.displayName,
      },
      request.requestContext,
    );

    return { data: result };
  }

  @Public()
  @Post("verify-email")
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessFlagDto, 201)
  async verifyEmail(@Body() input: VerifyEmailDto, @Req() request: Request) {
    const result = await this.verifyEmailUseCase.execute(
      { token: input.token },
      request.requestContext,
    );

    return { data: result };
  }

  @Public()
  @Post("resend-verification")
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiDataResponse(SuccessMessageDto, 201)
  async resendVerification(@Body() input: ResendVerificationDto) {
    const result = await this.resendVerificationUseCase.execute({ email: input.email });

    return { data: result };
  }
}
