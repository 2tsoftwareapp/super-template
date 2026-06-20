import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessControlModule } from '../access-control/access-control.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './application/auth.service';
import { AuthMailService } from './application/services/auth-mail.service';
import { SessionTokenService } from './application/services/session-token.service';
import { AuthenticateAccessTokenUseCase } from './application/use-cases/authenticate-access-token.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { GetSessionsUseCase } from './application/use-cases/get-sessions.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutAllUseCase } from './application/use-cases/logout-all.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case';
import { SwitchOrganizationUseCase } from './application/use-cases/switch-organization.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { AuthDataModule } from './auth-data.module';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    JwtModule.register({}),
    AccessControlModule,
    AuthDataModule,
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthMailService,
    SessionTokenService,
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
  ],
  exports: [AuthService],
})
export class AuthModule {}
