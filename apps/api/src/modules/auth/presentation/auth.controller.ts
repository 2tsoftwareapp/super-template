import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  ApiArrayResponse,
  ApiDataResponse,
  SuccessFlagDto,
  SuccessMessageDto,
} from '../../../common/decorators/api-response.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import type { AuthenticatedRequestUser } from '../../../common/types/request-context';
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
} from './auth.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiDataResponse(SuccessMessageDto, 201)
  register(@Body() input: RegisterDto, @Req() request: Request) {
    return this.authService.register(input, request.requestContext);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiDataResponse(AuthResponseDto, 201)
  login(@Body() input: LoginDto, @Req() request: Request) {
    return this.authService.login(input, request.requestContext);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
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
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @ApiDataResponse(SuccessMessageDto, 201)
  forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.authService.forgotPassword(input);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @ApiDataResponse(SuccessFlagDto, 201)
  resetPassword(@Body() input: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(input, request.requestContext);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-email')
  @ApiDataResponse(SuccessFlagDto, 201)
  verifyEmail(@Body() input: VerifyEmailDto, @Req() request: Request) {
    return this.authService.verifyEmail(input, request.requestContext);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
