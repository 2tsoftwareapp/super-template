import { Module } from '@nestjs/common';

import { AcceptInvitationUseCase } from './application/accept-invitation.use-case';
import { CreateInvitationUseCase } from './application/create-invitation.use-case';
import { InvitationsMapper } from './application/invitations.mapper';
import { INVITATIONS_REPOSITORY } from './application/invitations.repository.port';
import { InvitationsService } from './application/invitations.service';
import { ListInvitationsUseCase } from './application/list-invitations.use-case';
import { RevokeInvitationUseCase } from './application/revoke-invitation.use-case';
import { InvitationsRepository } from './infrastructure/invitations.repository';
import { InvitationsController } from './presentation/invitations.controller';

@Module({
  controllers: [InvitationsController],
  providers: [
    InvitationsRepository,
    InvitationsMapper,
    CreateInvitationUseCase,
    ListInvitationsUseCase,
    AcceptInvitationUseCase,
    RevokeInvitationUseCase,
    InvitationsService,
    {
      provide: INVITATIONS_REPOSITORY,
      useExisting: InvitationsRepository,
    },
  ],
  exports: [
    InvitationsRepository,
    InvitationsService,
    INVITATIONS_REPOSITORY,
  ],
})
export class InvitationsModule {}
