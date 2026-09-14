import type { RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  durationToMilliseconds,
  normalizeEmail,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
} from "@repo/api-kernel";
import { SETTINGS_ERROR_CODES } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { AUTH_USER_STORE, type AuthUserStore } from "@repo/feature-auth/contracts";
import {
  PERSONAL_ORGANIZATION_PROVISIONER,
  type PersonalOrganizationProvisioner,
} from "@repo/feature-organization-management/contracts";
import { OUTBOX_APPENDER, type OutboxAppenderPort } from "@repo/feature-outbox/contracts";
import {
  APPLICATION_SETTINGS_LOOKUP,
  type ApplicationSettingsLookup,
} from "@repo/feature-settings/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";

import type { RegisterCommand } from "../auth.types";

import {
  AUTH_ACCESS_PROFILE,
  type AuthAccessProfile,
} from "../../public/auth-access-profile.port";
import { generateOpaqueToken, hashOpaqueToken, hashPassword } from "../auth.helpers";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    @Inject(AUTH_ACCESS_PROFILE)
    private readonly accessProfile: AuthAccessProfile,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(OUTBOX_APPENDER) private readonly outbox: OutboxAppenderPort,
    @Inject(APPLICATION_SETTINGS_LOOKUP)
    private readonly applicationSettingsLookup: ApplicationSettingsLookup,
    @Inject(PERSONAL_ORGANIZATION_PROVISIONER)
    private readonly personalOrganizationProvisioner: PersonalOrganizationProvisioner,
  ) {}

  async execute(input: RegisterCommand, requestContext?: RequestContext) {
    const registrationEnabled = await this.applicationSettingsLookup.isRegistrationEnabled();

    if (!registrationEnabled) {
      throw new AppError(
        SETTINGS_ERROR_CODES.REGISTRATION_DISABLED,
        "Registration is currently disabled",
        HttpStatus.FORBIDDEN,
      );
    }

    const email = normalizeEmail(input.email);
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(
        USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
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

      const userRole = await this.accessProfile.getRoleByName("USER", null, transaction);

      if (!userRole) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          "Default USER role is missing",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.accessProfile.replaceUserRoles(user.id, [userRole.id], null, transaction);

      await this.personalOrganizationProvisioner.ensurePersonalOrganization(
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

      await this.outbox.append(
        "auth.send-verification-email",
        { email: user.email, token: verificationToken },
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
