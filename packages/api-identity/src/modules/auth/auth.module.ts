import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '@repo/api-platform/modules/audit/audit.module';
import { MailModule } from '@repo/api-platform/modules/mail/mail.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './application/auth.service';
import { AuthDataModule } from './auth-data.module';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    JwtModule.register({}),
    AccessControlModule,
    AuditModule,
    AuthDataModule,
    MailModule,
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
