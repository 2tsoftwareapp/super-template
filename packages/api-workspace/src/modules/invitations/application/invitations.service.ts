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
  PERMISSION_NAMES,
  requireOrganizationId,
} from '@repo/api-core';

import type {
  AcceptInvitationDto,
  CreateInvitationDto,
  InvitationsQueryDto,
} from '../presentation/invitations.dto';

import { ProjectsRepository } from '../../projects/infrastructure/projects.repository';
import { InvitationsRepository } from '../infrastructure/invitations.repository';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly projectsRepository: ProjectsRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(BACKGROUND_JOB_ENQUEUER)
    private readonly jobEnqueuer: BackgroundJobEnqueuer,
    private readonly environmentService: EnvironmentService,
  ) {}

  async create(
    actor: AuthenticatedRequestUser,
    input: CreateInvitationDto,
    requestContext?: RequestContext,
  ) {
    const email = normalizeEmail(input.email);
    await this.assertCanInvite(actor, input.entityType, input.entityId);

    await this.invitationsRepository.revokePendingForEntity(
      input.entityType,
      input.entityId,
      email,
    );

    const organizationId = await this.resolveOrganizationId(
      actor,
      input.entityType,
      input.entityId,
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

    return this.toInvitationDto(invitation);
  }

  async list(actor: AuthenticatedRequestUser, query: InvitationsQueryDto) {
    const result = await this.invitationsRepository.list({
      page: query.page,
      limit: query.limit,
      ...(query.email !== undefined ? { email: query.email } : {}),
      ...(query.entityType !== undefined
        ? { entityType: query.entityType }
        : {}),
      ...(query.entityId !== undefined ? { entityId: query.entityId } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });

    return {
      rows: result.rows.map((row) => this.toInvitationDto(row)),
      total: result.total,
    };
  }

  async accept(
    input: AcceptInvitationDto,
    actor?: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    const tokenHash = hashOpaqueToken(input.token);
    const invitation =
      await this.invitationsRepository.findByTokenHash(tokenHash);

    if (invitation?.status !== 'PENDING') {
      throw new AppError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        'Invitation is invalid or no longer available',
        HttpStatus.NOT_FOUND,
      );
    }

    if (invitation.expiresAt <= new Date()) {
      await this.invitationsRepository.update(invitation.id, {
        status: 'EXPIRED',
      });
      throw new AppError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        'Invitation has expired',
        HttpStatus.GONE,
      );
    }

    const acceptedById = actor?.userId ?? null;

    if (actor) {
      const actorEmail = normalizeEmail(actor.email);

      if (actorEmail !== invitation.email) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          'Invitation email does not match your account',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const updated = await this.invitationsRepository.update(invitation.id, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      acceptedById,
    });

    await this.auditWriter.log({
      actorId: acceptedById,
      action: 'invitation.accepted',
      entityType: invitation.entityType,
      entityId: invitation.entityId,
      metadata: { invitationId: invitation.id },
      requestContext,
    });

    return this.toInvitationDto(updated ?? invitation);
  }

  async revoke(
    actor: AuthenticatedRequestUser,
    invitationId: string,
    requestContext?: RequestContext,
  ) {
    const invitation = await this.invitationsRepository.findById(invitationId);

    if (!invitation) {
      throw new AppError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        'Invitation not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.assertCanInvite(
      actor,
      invitation.entityType,
      invitation.entityId,
    );

    if (invitation.status !== 'PENDING') {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'Only pending invitations can be revoked',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.invitationsRepository.update(invitation.id, {
      status: 'REVOKED',
    });

    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'invitation.revoked',
      entityType: invitation.entityType,
      entityId: invitation.entityId,
      metadata: { invitationId },
      requestContext,
    });

    return this.toInvitationDto(updated ?? invitation);
  }

  private async resolveOrganizationId(
    actor: AuthenticatedRequestUser,
    entityType: string,
    entityId: string,
  ) {
    if (entityType === 'project') {
      const project = await this.projectsRepository.findById(entityId);

      if (!project) {
        throw new AppError(
          ERROR_CODES.PROJECT_NOT_FOUND,
          'Project not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return project.organizationId;
    }

    return requireOrganizationId(actor);
  }

  private async assertCanInvite(
    actor: AuthenticatedRequestUser,
    entityType: string,
    entityId: string,
  ) {
    if (!actor.permissions.includes(PERMISSION_NAMES.INVITATIONS_CREATE)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You do not have permission to create invitations',
        HttpStatus.FORBIDDEN,
      );
    }

    if (entityType === 'project') {
      if (!actor.permissions.includes(PERMISSION_NAMES.PROJECTS_INVITE)) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          'You do not have permission to invite project collaborators',
          HttpStatus.FORBIDDEN,
        );
      }

      const project = await this.projectsRepository.findById(entityId);

      if (!project) {
        throw new AppError(
          ERROR_CODES.PROJECT_NOT_FOUND,
          'Project not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (
        project.ownerId !== actor.userId &&
        !actor.roles.includes('ADMIN') &&
        !actor.roles.includes('SUPER_ADMIN')
      ) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          'You cannot invite collaborators to this project',
          HttpStatus.FORBIDDEN,
        );
      }
    }
  }

  private toInvitationDto(
    invitation: NonNullable<
      Awaited<ReturnType<InvitationsRepository['findById']>>
    >,
  ) {
    return {
      id: invitation.id,
      email: invitation.email,
      entityType: invitation.entityType,
      entityId: invitation.entityId,
      role: invitation.role ?? null,
      invitedById: invitation.invitedById,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      acceptedById: invitation.acceptedById ?? null,
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
    };
  }
}
