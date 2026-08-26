import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ACCESS_TOKEN_AUTHENTICATOR } from "@repo/api-core";

import { AccessControlModule } from "../access-control";
import { MfaModule } from "../mfa/mfa.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { UsersModule } from "../users/users.module";
import { AuthMapper } from "./application/auth.mapper";
import { AuthService } from "./application/auth.service";
import { AUTH_TOKEN_PROVIDER } from "./application/ports/auth-token.provider.port";
import { OutboxProcessor } from "./application/services/outbox-processor.service";
import { AuthenticateAccessTokenUseCase } from "./application/use-cases/authenticate-access-token.use-case";
import { CompleteMfaLoginUseCase } from "./application/use-cases/complete-mfa-login.use-case";
import { ForgotPasswordUseCase } from "./application/use-cases/forgot-password.use-case";
import { GetMeUseCase } from "./application/use-cases/get-me.use-case";
import { GetSessionsUseCase } from "./application/use-cases/get-sessions.use-case";
import { IssueSessionUseCase } from "./application/use-cases/issue-session.use-case";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { LogoutAllUseCase } from "./application/use-cases/logout-all.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { RefreshSessionUseCase } from "./application/use-cases/refresh-session.use-case";
import { RegisterUseCase } from "./application/use-cases/register.use-case";
import { ResendVerificationUseCase } from "./application/use-cases/resend-verification.use-case";
import { ResetPasswordUseCase } from "./application/use-cases/reset-password.use-case";
import { RevokeSessionUseCase } from "./application/use-cases/revoke-session.use-case";
import { SwitchOrganizationUseCase } from "./application/use-cases/switch-organization.use-case";
import { VerifyEmailUseCase } from "./application/use-cases/verify-email.use-case";
import { AuthDataModule } from "./auth-data.module";
import { SessionTokenService } from "./infrastructure/session-token.service";
import { AuthLoginController } from "./presentation/auth-login.controller";
import { AuthRecoveryController } from "./presentation/auth-recovery.controller";
import { AuthRegistrationController } from "./presentation/auth-registration.controller";
import { AuthSessionController } from "./presentation/auth-session.controller";

@Module({
  imports: [
    JwtModule.register({}),
    AccessControlModule,
    AuthDataModule,
    MfaModule,
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [
    AuthLoginController,
    AuthRegistrationController,
    AuthRecoveryController,
    AuthSessionController,
  ],
  providers: [
    AuthService,
    {
      provide: ACCESS_TOKEN_AUTHENTICATOR,
      useExisting: AuthService,
    },
    AuthMapper,
    SessionTokenService,
    {
      provide: AUTH_TOKEN_PROVIDER,
      useExisting: SessionTokenService,
    },
    IssueSessionUseCase,
    CompleteMfaLoginUseCase,
    RegisterUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    SwitchOrganizationUseCase,
    LogoutUseCase,
    LogoutAllUseCase,
    GetMeUseCase,
    GetSessionsUseCase,
    RevokeSessionUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    AuthenticateAccessTokenUseCase,
    OutboxProcessor,
  ],
  exports: [
    AuthService,
    ACCESS_TOKEN_AUTHENTICATOR,
    IssueSessionUseCase,
    AUTH_TOKEN_PROVIDER,
    AuthDataModule,
  ],
})
export class AuthModule {}
