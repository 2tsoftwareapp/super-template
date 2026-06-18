import type { RequestContext } from '@repo/api-core';
import type { DatabaseClient } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  durationToMilliseconds,
  ERROR_CODES,
  normalizeEmail,
} from '@repo/api-core';
import { DATABASE } from '@repo/api-database';
import { runInTransaction } from '@repo/api-database';

import type { RegisterCommand } from './auth.types';

import { AccessControlService } from '../../access-control/application/access-control.service';
import { OrganizationsService } from '../../organizations/application/organizations.service';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { AuthRepository } from '../infrastructure/auth.repository';
import { AuthMailService } from './auth-mail.service';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
} from './auth.helpers';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly usersRepository: UsersRepository,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly authRepository: AuthRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly authMailService: AuthMailService,
  ) {}

  async execute(input: RegisterCommand, requestContext?: RequestContext) {
    const email = normalizeEmail(input.email);
    await this.usersRepository.assertEmailAvailable(email);

    const result = await runInTransaction(
      this.database,
      async (transaction) => {
        const user = await this.usersRepository.create(
          {
            email,
            passwordHash: await hashPassword(input.password),
            displayName: input.displayName,
            status: 'PENDING',
          },
          transaction,
        );

        const userRole = await this.accessControlService.getRoleByName(
          'USER',
          transaction,
        );

        if (!userRole) {
          throw new AppError(
            ERROR_CODES.INTERNAL_ERROR,
            'Default USER role is missing',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        await this.accessControlService.replaceUserRoles(
          user.id,
          [userRole.id],
          undefined,
          transaction,
        );

        await this.organizationsService.ensurePersonalOrganization(
          user.id,
          user.displayName,
          transaction,
        );

        const verificationToken = generateOpaqueToken();
        await this.authRepository.storeEmailVerificationToken(
          {
            userId: user.id,
            tokenHash: hashOpaqueToken(verificationToken),
            expiresAt: new Date(Date.now() + durationToMilliseconds('1d')),
          },
          transaction,
        );

        await this.auditWriter.log(
          {
            actorId: user.id,
            action: 'auth.registered',
            entityType: 'user',
            entityId: user.id,
            requestContext,
          },
          transaction,
        );

        return {
          user,
          verificationToken,
        };
      },
    );

    await this.authMailService.sendVerificationEmail(
      result.user.email,
      result.verificationToken,
    );

    return {
      data: {
        success: true,
        message: 'Registration successful. Verify your email to continue.',
      },
    };
  }
}
