import { Module } from '@nestjs/common';

import { InvitationsService } from './application/invitations.service';
import { InvitationsRepository } from './infrastructure/invitations.repository';
import { InvitationsController } from './presentation/invitations.controller';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsRepository, InvitationsService],
  exports: [InvitationsRepository, InvitationsService],
})
export class InvitationsModule {}
