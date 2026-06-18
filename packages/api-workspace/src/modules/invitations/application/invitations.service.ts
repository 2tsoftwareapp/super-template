import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  AcceptInvitationCommand,
  CreateInvitationCommand,
  ListInvitationsQuery,
} from './invitations.types';

import { AcceptInvitationUseCase } from './accept-invitation.use-case';
import { CreateInvitationUseCase } from './create-invitation.use-case';
import { ListInvitationsUseCase } from './list-invitations.use-case';
import { RevokeInvitationUseCase } from './revoke-invitation.use-case';

export type { InvitationView as InvitationDto } from './invitations.types';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly createInvitationUseCase: CreateInvitationUseCase,
    private readonly listInvitationsUseCase: ListInvitationsUseCase,
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
    private readonly revokeInvitationUseCase: RevokeInvitationUseCase,
  ) {}

  create(
    actor: AuthenticatedRequestUser,
    input: CreateInvitationCommand,
    requestContext?: RequestContext,
  ) {
    return this.createInvitationUseCase.execute(actor, input, requestContext);
  }

  list(actor: AuthenticatedRequestUser, query: ListInvitationsQuery) {
    return this.listInvitationsUseCase.execute(actor, query);
  }

  accept(
    input: AcceptInvitationCommand,
    actor?: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    return this.acceptInvitationUseCase.execute(input, actor, requestContext);
  }

  revoke(
    actor: AuthenticatedRequestUser,
    invitationId: string,
    requestContext?: RequestContext,
  ) {
    return this.revokeInvitationUseCase.execute(
      actor,
      invitationId,
      requestContext,
    );
  }
}
