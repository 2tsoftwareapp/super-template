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

import { AuthService } from '../application/auth.service';
import {
  AuthMeDto,
  AuthResponseDto,
  AuthSessionDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SwitchOrganizationDto,
  VerifyEmailDto,
} from './auth.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiDataResponse(SuccessMessageDto, 201)
  register(@Body() input: RegisterDto, @Req() request: Request) {
    return this.authService.register(
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
  @ApiDataResponse(AuthResponseDto, 201)
  login(@Body() input: LoginDto, @Req() request: Request) {
    return this.authService.login(
      {
        email: input.email,
        password: input.password,
      },
      request.requestContext,
    );
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiDataResponse(AuthResponseDto, 201)
  refresh(@Body() input: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(
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
    await this.authService.logout(user, request.requestContext);

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
    await this.authService.logoutAll(user, request.requestContext);

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
    return this.authService.forgotPassword({ email: input.email });
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessFlagDto, 201)
  resetPassword(@Body() input: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(
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
    return this.authService.verifyEmail(
      { token: input.token },
      request.requestContext,
    );
  }

  @Public()
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiDataResponse(SuccessMessageDto, 201)
  resendVerification(@Body() input: ResendVerificationDto) {
    return this.authService.resendVerification({ email: input.email });
  }

  @Get('me')
  @ApiDataResponse(AuthMeDto)
  getMe(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.authService.getMe(user);
  }

  @Post('switch-organization')
  @ApiDataResponse(SuccessFlagDto, 201)
  switchOrganization(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: SwitchOrganizationDto,
    @Req() request: Request,
  ) {
    return this.authService.switchOrganization(
      user,
      input.organizationId,
      request.requestContext,
    );
  }

  @Get('sessions')
  @ApiArrayResponse(AuthSessionDto)
  getSessions(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.authService.getSessions(user);
  }

  @Delete('sessions/:sessionId')
  @ApiDataResponse(SuccessFlagDto)
  async revokeSession(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Req() request: Request,
  ) {
    await this.authService.revokeSession(
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
