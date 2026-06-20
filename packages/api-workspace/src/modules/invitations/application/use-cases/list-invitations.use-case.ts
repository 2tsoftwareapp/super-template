import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import type { ListInvitationsQuery } from '../invitations.types';

import { InvitationsMapper } from '../invitations.mapper';
import {
  INVITATIONS_REPOSITORY,
  type InvitationsRepositoryPort,
} from '../invitations.repository.port';

@Injectable()
export class ListInvitationsUseCase {
  private readonly invitationsMapper = new InvitationsMapper();

  constructor(
    @Inject(INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: InvitationsRepositoryPort,
  ) {}

  async execute(_actor: AuthenticatedRequestUser, query: ListInvitationsQuery) {
    const result = await this.invitationsRepository.list(query);

    return {
      rows: result.rows.map((row) =>
        this.invitationsMapper.toInvitationView(row),
      ),
      total: result.total,
    };
  }
}
