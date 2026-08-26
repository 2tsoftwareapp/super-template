import type { Request } from "express";

import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiDataResponse } from "@repo/api-runtime";
import { Public } from "@repo/api-runtime";

import { CompleteMfaLoginUseCase } from "../application/use-cases/complete-mfa-login.use-case";
import { LoginUseCase } from "../application/use-cases/login.use-case";
import { RefreshSessionUseCase } from "../application/use-cases/refresh-session.use-case";
import { AuthResponseDto } from "./dto/auth-response.dto";
import {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  VerifyMfaChallengeDto,
} from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthLoginController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly completeMfaLoginUseCase: CompleteMfaLoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
  ) {}

  @Public()
  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiDataResponse(LoginResponseDto, 201)
  login(@Body() input: LoginDto, @Req() request: Request) {
    return this.loginUseCase.execute(
      {
        email: input.email,
        password: input.password,
      },
      request.requestContext,
    );
  }

  @Public()
  @Post("mfa/verify-challenge")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiDataResponse(AuthResponseDto, 201)
  verifyMfaChallenge(@Body() input: VerifyMfaChallengeDto, @Req() request: Request) {
    return this.completeMfaLoginUseCase.execute(
      {
        mfaToken: input.mfaToken,
        code: input.code,
      },
      request.requestContext,
    );
  }

  @Public()
  @Post("refresh")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiDataResponse(AuthResponseDto, 201)
  refresh(@Body() input: RefreshTokenDto, @Req() request: Request) {
    return this.refreshSessionUseCase.execute(
      { refreshToken: input.refreshToken },
      request.requestContext,
    );
  }
}
