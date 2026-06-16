import { Module } from '@nestjs/common';
import { AuditModule } from '@repo/api-platform/modules/audit/audit.module';
import { JobsModule } from '@repo/api-platform/modules/jobs/jobs.module';
import { ProjectsModule } from '@repo/api-workspace/modules/projects/projects.module';
import { UsersModule } from '@repo/api-identity/modules/users/users.module';
import { InvitationsService } from './application/invitations.service';
import { InvitationsRepository } from './infrastructure/invitations.repository';
import { InvitationsController } from './presentation/invitations.controller';

@Module({
  imports: [AuditModule, ProjectsModule, UsersModule, JobsModule],
  controllers: [InvitationsController],
  providers: [InvitationsRepository, InvitationsService],
  exports: [InvitationsRepository, InvitationsService],
})
export class InvitationsModule {}
