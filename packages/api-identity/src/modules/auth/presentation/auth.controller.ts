import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiArrayResponse,
  ApiDataResponse,
  SuccessFlagDto,
  SuccessMessageDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Public } from '@repo/api-core';
import type { AuthenticatedRequestUser } from '@repo/api-core';
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
  VerifyEmailDto,
  SwitchOrganizationDto,
} from './auth.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiDataResponse(SuccessMessageDto, 201)
  register(@Body() input: RegisterDto, @Req() request: Request) {
    return this.authService.register(input, request.requestContext);
  }

  @Public()
  @Post('login')
  @ApiDataResponse(AuthResponseDto, 201)
  login(@Body() input: LoginDto, @Req() request: Request) {
    return this.authService.login(input, request.requestContext);
  }

  @Public()
  @Post('refresh')
  @ApiDataResponse(AuthResponseDto, 201)
  refresh(@Body() input: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(input, request.requestContext);
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
  @ApiDataResponse(SuccessMessageDto, 201)
  forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.authService.forgotPassword(input);
  }

  @Public()
  @Post('reset-password')
  @ApiDataResponse(SuccessFlagDto, 201)
  resetPassword(@Body() input: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(input, request.requestContext);
  }

  @Public()
  @Post('verify-email')
  @ApiDataResponse(SuccessFlagDto, 201)
  verifyEmail(@Body() input: VerifyEmailDto, @Req() request: Request) {
    return this.authService.verifyEmail(input, request.requestContext);
  }

  @Public()
  @Post('resend-verification')
  @ApiDataResponse(SuccessMessageDto, 201)
  resendVerification(@Body() input: ResendVerificationDto) {
    return this.authService.resendVerification(input);
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
    @Param('sessionId') sessionId: string,
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
