import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { OrganizationsRepository } from '../../infrastructure/organizations.repository';

@Injectable()
export class ListOrganizationMembersUseCase {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async execute(organizationId: string, userId: string) {
    const membership = await this.organizationsRepository.findMembership(
      organizationId,
      userId,
    );

    if (!membership) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You are not a member of this organization',
        HttpStatus.FORBIDDEN,
      );
    }

    const members = await this.organizationsRepository.listMembers(organizationId);

    return {
      data: members.map((member) => ({
        userId: member.userId,
        email: member.email,
        displayName: member.displayName,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      })),
    };
  }
}
