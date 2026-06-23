import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  ForgotPasswordCommand,
  LoginCommand,
  RefreshSessionCommand,
  RegisterCommand,
  ResendVerificationCommand,
  ResetPasswordCommand,
  VerifyEmailCommand,
  VerifyMfaChallengeCommand,
} from './auth.types';

import { AuthenticateAccessTokenUseCase } from './use-cases/authenticate-access-token.use-case';
import { CompleteMfaLoginUseCase } from './use-cases/complete-mfa-login.use-case';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-case';
import { GetMeUseCase } from './use-cases/get-me.use-case';
import { GetSessionsUseCase } from './use-cases/get-sessions.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutAllUseCase } from './use-cases/logout-all.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RefreshSessionUseCase } from './use-cases/refresh-session.use-case';
import { RegisterUseCase } from './use-cases/register.use-case';
import { ResendVerificationUseCase } from './use-cases/resend-verification.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { RevokeSessionUseCase } from './use-cases/revoke-session.use-case';
import { SwitchOrganizationUseCase } from './use-cases/switch-organization.use-case';
import { VerifyEmailUseCase } from './use-cases/verify-email.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly switchOrganizationUseCase: SwitchOrganizationUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly logoutAllUseCase: LogoutAllUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly getSessionsUseCase: GetSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly authenticateAccessTokenUseCase: AuthenticateAccessTokenUseCase,
    private readonly completeMfaLoginUseCase: CompleteMfaLoginUseCase,
  ) {}

  register(input: RegisterCommand, requestContext?: RequestContext) {
    return this.registerUseCase.execute(input, requestContext);
  }

  login(input: LoginCommand, requestContext?: RequestContext) {
    return this.loginUseCase.execute(input, requestContext);
  }

  refresh(input: RefreshSessionCommand, requestContext?: RequestContext) {
    return this.refreshSessionUseCase.execute(input, requestContext);
  }

  switchOrganization(
    user: AuthenticatedRequestUser,
    organizationId: string,
    requestContext?: RequestContext,
  ) {
    return this.switchOrganizationUseCase.execute(
      user,
      organizationId,
      requestContext,
    );
  }

  logout(user: AuthenticatedRequestUser, requestContext?: RequestContext) {
    return this.logoutUseCase.execute(user, requestContext);
  }

  logoutAll(user: AuthenticatedRequestUser, requestContext?: RequestContext) {
    return this.logoutAllUseCase.execute(user, requestContext);
  }

  getMe(user: AuthenticatedRequestUser) {
    return this.getMeUseCase.execute(user);
  }

  getSessions(user: AuthenticatedRequestUser) {
    return this.getSessionsUseCase.execute(user);
  }

  revokeSession(
    user: AuthenticatedRequestUser,
    sessionId: string,
    requestContext?: RequestContext,
  ) {
    return this.revokeSessionUseCase.execute(
      user,
      sessionId,
      requestContext,
    );
  }

  forgotPassword(input: ForgotPasswordCommand) {
    return this.forgotPasswordUseCase.execute(input);
  }

  resetPassword(input: ResetPasswordCommand, requestContext?: RequestContext) {
    return this.resetPasswordUseCase.execute(input, requestContext);
  }

  verifyEmail(input: VerifyEmailCommand, requestContext?: RequestContext) {
    return this.verifyEmailUseCase.execute(input, requestContext);
  }

  resendVerification(input: ResendVerificationCommand) {
    return this.resendVerificationUseCase.execute(input);
  }

  authenticateAccessToken(token: string) {
    return this.authenticateAccessTokenUseCase.execute(token);
  }

  verifyMfaChallenge(
    input: VerifyMfaChallengeCommand,
    requestContext?: RequestContext,
  ) {
    return this.completeMfaLoginUseCase.execute(input, requestContext);
  }
}
