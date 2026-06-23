import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  BACKGROUND_JOB_ENQUEUER,
  type BackgroundJobEnqueuer,
  durationToMilliseconds,
  EnvironmentService,
  ERROR_CODES,
  generateOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
  PROJECT_LOOKUP,
  type ProjectLookup,
} from '@repo/api-core';
import { ROLE_NAMES } from '@repo/api-core';
import { OrganizationsRepository } from '@repo/api-identity/modules/organizations/infrastructure/organizations.repository';

import type { CreateInvitationCommand, InvitationView } from '../invitations.types';

import {
  assertCanInvite,
  INVITATION_ENTITY,
  resolveInvitationOrganizationId,
} from '../../domain/invitation-access.policy';
import { InvitationsMapper } from '../invitations.mapper';
import {
  INVITATIONS_REPOSITORY,
  type InvitationsRepositoryPort,
} from '../invitations.repository.port';

@Injectable()
export class CreateInvitationUseCase {
  private readonly invitationsMapper = new InvitationsMapper();

  constructor(
    @Inject(INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: InvitationsRepositoryPort,
    @Inject(PROJECT_LOOKUP) private readonly projectLookup: ProjectLookup,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(BACKGROUND_JOB_ENQUEUER)
    private readonly jobEnqueuer: BackgroundJobEnqueuer,
    private readonly environmentService: EnvironmentService,
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateInvitationCommand,
    requestContext?: RequestContext,
  ): Promise<InvitationView> {
    const email = normalizeEmail(input.email);
    await assertCanInvite(
      actor,
      input.entityType,
      input.entityId,
      this.projectLookup,
    );

    if (input.entityType === INVITATION_ENTITY.ORGANIZATION) {
      const organization = await this.organizationsRepository.findById(
        input.entityId,
      );

      if (!organization) {
        throw new AppError(
          ERROR_CODES.RESOURCE_CONFLICT,
          'Organization is no longer available',
          HttpStatus.CONFLICT,
        );
      }

      if (!actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
        const membership = await this.organizationsRepository.findMembership(
          input.entityId,
          actor.userId,
        );

        if (!membership) {
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            'You cannot invite users to an organization you do not belong to',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      if (
        input.role &&
        input.role !== 'ADMIN' &&
        input.role !== 'MEMBER'
      ) {
        throw new AppError(
          ERROR_CODES.VALIDATION_FAILED,
          'Organization invitations only support ADMIN or MEMBER roles',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    await this.invitationsRepository.revokePendingForEntity(
      input.entityType,
      input.entityId,
      email,
    );

    const organizationId = await resolveInvitationOrganizationId(
      actor,
      input.entityType,
      input.entityId,
      this.projectLookup,
    );
    const token = generateOpaqueToken();
    const invitation = await this.invitationsRepository.create({
      organizationId,
      email,
      tokenHash: hashOpaqueToken(token),
      entityType: input.entityType,
      entityId: input.entityId,
      role: input.role ?? null,
      invitedById: actor.userId,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + durationToMilliseconds('7d')),
    });

    if (!invitation) {
      throw new Error('Invitation insert returned no rows');
    }

    const acceptUrl = `${this.environmentService.values.NEXT_PUBLIC_WEB_URL}/invitations/accept?token=${token}`;

    await this.jobEnqueuer.enqueue({
      type: 'mail.send',
      organizationId,
      payload: {
        templateKey: 'auth.welcome',
        to: email,
        variables: {
          displayName: email,
          webUrl: acceptUrl,
        },
        metadata: {
          invitationId: invitation.id,
          kind: 'invitation',
        },
      },
      createdById: actor.userId,
    });

    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'invitation.created',
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { invitationId: invitation.id, email },
      requestContext,
    });

    return this.invitationsMapper.toInvitationView(invitation);
  }
}
