import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ApiArrayResponse,
  ApiDataResponse,
  SuccessFlagDto,
  SuccessMessageDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Public } from '@repo/api-core';

import { CompleteMfaLoginUseCase } from '../application/use-cases/complete-mfa-login.use-case';
import { ForgotPasswordUseCase } from '../application/use-cases/forgot-password.use-case';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { GetSessionsUseCase } from '../application/use-cases/get-sessions.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { LogoutAllUseCase } from '../application/use-cases/logout-all.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '../application/use-cases/refresh-session.use-case';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { ResendVerificationUseCase } from '../application/use-cases/resend-verification.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { RevokeSessionUseCase } from '../application/use-cases/revoke-session.use-case';
import { SwitchOrganizationUseCase } from '../application/use-cases/switch-organization.use-case';
import { VerifyEmailUseCase } from '../application/use-cases/verify-email.use-case';
import {
  AuthMeDto,
  AuthResponseDto,
  AuthSessionDto,
  ForgotPasswordDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SwitchOrganizationDto,
  SwitchOrganizationResponseDto,
  VerifyEmailDto,
  VerifyMfaChallengeDto,
} from './auth.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly completeMfaLoginUseCase: CompleteMfaLoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly logoutAllUseCase: LogoutAllUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly switchOrganizationUseCase: SwitchOrganizationUseCase,
    private readonly getSessionsUseCase: GetSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiDataResponse(SuccessMessageDto, 201)
  register(@Body() input: RegisterDto, @Req() request: Request) {
    return this.registerUseCase.execute(
      {
        email: input.email,
        password: input.password,
        displayName: input.displayName,
      },
      request.requestContext,
    );
  }

  @Public()
  @Post('login')
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
  @Post('mfa/verify-challenge')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiDataResponse(AuthResponseDto, 201)
  verifyMfaChallenge(
    @Body() input: VerifyMfaChallengeDto,
    @Req() request: Request,
  ) {
    return this.completeMfaLoginUseCase.execute(
      {
        mfaToken: input.mfaToken,
        code: input.code,
      },
      request.requestContext,
    );
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiDataResponse(AuthResponseDto, 201)
  refresh(@Body() input: RefreshTokenDto, @Req() request: Request) {
    return this.refreshSessionUseCase.execute(
      { refreshToken: input.refreshToken },
      request.requestContext,
    );
  }

  @Post('logout')
  @ApiDataResponse(SuccessFlagDto, 201)
  async logout(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() request: Request,
  ) {
    await this.logoutUseCase.execute(user, request.requestContext);

    return {
      data: {
        success: true,
      },
    };
  }

  @Post('logout-all')
  @ApiDataResponse(SuccessFlagDto, 201)
  async logoutAll(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() request: Request,
  ) {
    await this.logoutAllUseCase.execute(user, request.requestContext);

    return {
      data: {
        success: true,
      },
    };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessMessageDto, 201)
  forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute({ email: input.email });
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessFlagDto, 201)
  resetPassword(@Body() input: ResetPasswordDto, @Req() request: Request) {
    return this.resetPasswordUseCase.execute(
      {
        token: input.token,
        newPassword: input.newPassword,
      },
      request.requestContext,
    );
  }

  @Public()
  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessFlagDto, 201)
  verifyEmail(@Body() input: VerifyEmailDto, @Req() request: Request) {
    return this.verifyEmailUseCase.execute(
      { token: input.token },
      request.requestContext,
    );
  }

  @Public()
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessMessageDto, 201)
  resendVerification(@Body() input: ResendVerificationDto) {
    return this.resendVerificationUseCase.execute({ email: input.email });
  }

  @Get('me')
  @ApiDataResponse(AuthMeDto)
  getMe(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.getMeUseCase.execute(user);
  }

  @Post('switch-organization')
  @ApiDataResponse(SwitchOrganizationResponseDto, 201)
  switchOrganization(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: SwitchOrganizationDto,
    @Req() request: Request,
  ) {
    return this.switchOrganizationUseCase.execute(
      user,
      input.organizationId,
      request.requestContext,
    );
  }

  @Get('sessions')
  @ApiArrayResponse(AuthSessionDto)
  getSessions(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.getSessionsUseCase.execute(user);
  }

  @Delete('sessions/:sessionId')
  @ApiDataResponse(SuccessFlagDto)
  async revokeSession(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Req() request: Request,
  ) {
    await this.revokeSessionUseCase.execute(
      user,
      sessionId,
      request.requestContext,
    );

    return {
      data: {
        success: true,
      },
    };
  }
}
