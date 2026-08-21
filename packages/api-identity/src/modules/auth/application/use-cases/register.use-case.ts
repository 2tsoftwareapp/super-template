import type { RequestContext } from "@repo/api-core";
import type { TransactionPort } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  APPLICATION_SETTINGS_LOOKUP,
  type ApplicationSettingsLookup,
  AUDIT_WRITER,
  type AuditWriter,
  durationToMilliseconds,
  ERROR_CODES,
  normalizeEmail,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
} from "@repo/api-core";

import type { RegisterCommand } from "../auth.types";

import { AccessControlService } from "../../../access-control";
import { OrganizationsService } from "../../../organizations";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "../../../users";
import { generateOpaqueToken, hashOpaqueToken, hashPassword } from "../auth.helpers";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";
import { OUTBOX_REPOSITORY, type OutboxRepositoryPort } from "../ports/outbox.repository.port";

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(OUTBOX_REPOSITORY) private readonly outboxRepository: OutboxRepositoryPort,
    @Inject(APPLICATION_SETTINGS_LOOKUP)
    private readonly applicationSettingsLookup: ApplicationSettingsLookup,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async execute(input: RegisterCommand, requestContext?: RequestContext) {
    const registrationEnabled = await this.applicationSettingsLookup.isRegistrationEnabled();

    if (!registrationEnabled) {
      throw new AppError(
        ERROR_CODES.REGISTRATION_DISABLED,
        "Registration is currently disabled",
        HttpStatus.FORBIDDEN,
      );
    }

    const email = normalizeEmail(input.email);
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(
        ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
        "A user with this email already exists",
        HttpStatus.CONFLICT,
      );
    }

    await this.transactionPort.run(async (transaction) => {
      const user = await this.usersRepository.create(
        {
          email,
          passwordHash: await hashPassword(input.password),
          displayName: input.displayName,
          status: "PENDING",
        },
        transaction,
      );

      const userRole = await this.accessControlService.getRoleByName("USER", null, transaction);

      if (!userRole) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          "Default USER role is missing",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.accessControlService.replaceUserRoles(user.id, [userRole.id], null, transaction);

      await this.organizationsService.ensurePersonalOrganization(
        user.id,
        user.displayName,
        transaction,
      );

      const verificationToken = generateOpaqueToken();
      await this.authSessionRepository.storeEmailVerificationToken(
        {
          userId: user.id,
          tokenHash: hashOpaqueToken(verificationToken),
          expiresAt: new Date(Date.now() + durationToMilliseconds("1d")),
        },
        transaction,
      );

      await this.outboxRepository.create(
        {
          topic: "auth.send-verification-email",
          payload: { email: user.email, token: verificationToken },
        },
        transaction,
      );

      await this.auditWriter.log(
        {
          actorId: user.id,
          action: "auth.registered",
          entityType: "user",
          entityId: user.id,
          requestContext,
          scope: SYSTEM_SCOPE.PLATFORM,
        },
        transaction,
      );
    });

    return {
      success: true,
      message: "Registration successful. Verify your email to continue.",
    };
  }
}
