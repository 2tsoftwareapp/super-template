import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessControlModule } from '../access-control/access-control.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AuthMailService } from './application/auth-mail.service';
import { AuthService } from './application/auth.service';
import { AuthenticateAccessTokenUseCase } from './application/authenticate-access-token.use-case';
import { EmailVerificationUseCase } from './application/email-verification.use-case';
import { LoginUseCase } from './application/login.use-case';
import { PasswordResetUseCase } from './application/password-reset.use-case';
import { RefreshSessionUseCase } from './application/refresh-session.use-case';
import { RegisterUseCase } from './application/register.use-case';
import { SessionManagementUseCase } from './application/session-management.use-case';
import { SessionTokenService } from './application/session-token.service';
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
    SessionManagementUseCase,
    PasswordResetUseCase,
    EmailVerificationUseCase,
    AuthenticateAccessTokenUseCase,
  ],
  exports: [AuthService],
})
export class AuthModule {}
