import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../presentation/auth.dto';

import { AuthenticateAccessTokenUseCase } from './authenticate-access-token.use-case';
import { EmailVerificationUseCase } from './email-verification.use-case';
import { LoginUseCase } from './login.use-case';
import { PasswordResetUseCase } from './password-reset.use-case';
import { RefreshSessionUseCase } from './refresh-session.use-case';
import { RegisterUseCase } from './register.use-case';
import { SessionManagementUseCase } from './session-management.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly sessionManagementUseCase: SessionManagementUseCase,
    private readonly passwordResetUseCase: PasswordResetUseCase,
    private readonly emailVerificationUseCase: EmailVerificationUseCase,
    private readonly authenticateAccessTokenUseCase: AuthenticateAccessTokenUseCase,
  ) {}

  register(input: RegisterDto, requestContext?: RequestContext) {
    return this.registerUseCase.execute(input, requestContext);
  }

  login(input: LoginDto, requestContext?: RequestContext) {
    return this.loginUseCase.execute(input, requestContext);
  }

  refresh(input: RefreshTokenDto, requestContext?: RequestContext) {
    return this.refreshSessionUseCase.execute(input, requestContext);
  }

  switchOrganization(
    user: AuthenticatedRequestUser,
    organizationId: string,
    requestContext?: RequestContext,
  ) {
    return this.sessionManagementUseCase.switchOrganization(
      user,
      organizationId,
      requestContext,
    );
  }

  logout(user: AuthenticatedRequestUser, requestContext?: RequestContext) {
    return this.sessionManagementUseCase.logout(user, requestContext);
  }

  logoutAll(user: AuthenticatedRequestUser, requestContext?: RequestContext) {
    return this.sessionManagementUseCase.logoutAll(user, requestContext);
  }

  getMe(user: AuthenticatedRequestUser) {
    return this.sessionManagementUseCase.getMe(user);
  }

  getSessions(user: AuthenticatedRequestUser) {
    return this.sessionManagementUseCase.getSessions(user);
  }

  revokeSession(
    user: AuthenticatedRequestUser,
    sessionId: string,
    requestContext?: RequestContext,
  ) {
    return this.sessionManagementUseCase.revokeSession(
      user,
      sessionId,
      requestContext,
    );
  }

  forgotPassword(input: ForgotPasswordDto) {
    return this.passwordResetUseCase.forgotPassword(input);
  }

  resetPassword(input: ResetPasswordDto, requestContext?: RequestContext) {
    return this.passwordResetUseCase.resetPassword(input, requestContext);
  }

  verifyEmail(input: VerifyEmailDto, requestContext?: RequestContext) {
    return this.emailVerificationUseCase.verifyEmail(input, requestContext);
  }

  resendVerification(input: ResendVerificationDto) {
    return this.emailVerificationUseCase.resendVerification(input);
  }

  authenticateAccessToken(token: string) {
    return this.authenticateAccessTokenUseCase.execute(token);
  }
}
