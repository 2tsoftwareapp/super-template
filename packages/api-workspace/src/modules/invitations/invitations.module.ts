import { Module } from '@nestjs/common';

import { InvitationsMapper } from './application/invitations.mapper';
import { INVITATIONS_REPOSITORY } from './application/invitations.repository.port';
import { InvitationsService } from './application/invitations.service';
import { AcceptInvitationUseCase } from './application/use-cases/accept-invitation.use-case';
import { CreateInvitationUseCase } from './application/use-cases/create-invitation.use-case';
import { ListInvitationsUseCase } from './application/use-cases/list-invitations.use-case';
import { RevokeInvitationUseCase } from './application/use-cases/revoke-invitation.use-case';
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
