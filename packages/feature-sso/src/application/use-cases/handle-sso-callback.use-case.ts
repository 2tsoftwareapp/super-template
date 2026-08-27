import type { RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ERROR_CODES } from "@repo/api-runtime";
import {
  AppError,
  generateOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
  SYSTEM_SCOPE,
} from "@repo/api-runtime";
import { PLATFORM_TRANSACTION_PORT } from "@repo/api-runtime";
import { AccessControlService } from "@repo/feature-access-control/contracts";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { hashPassword } from "@repo/feature-auth/contracts";
import { IssueSessionUseCase } from "@repo/feature-auth/contracts";
import { OrganizationsService } from "@repo/feature-organizations/contracts";
import { SSO_ERROR_CODES } from "@repo/feature-sso/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";

import type { HandleSsoCallbackCommand } from "../sso.types";

import { decideAccountLinking } from "../../domain/account-linking.policy";
import { SSO_PROVIDER_REGISTRY, type SsoProviderRegistry } from "../ports/sso-provider.port";
import { SSO_REPOSITORY, type SsoRepositoryPort } from "../ports/sso.repository.port";

@Injectable()
export class HandleSsoCallbackUseCase {
  constructor(
    @Inject(SSO_PROVIDER_REGISTRY)
    private readonly providers: SsoProviderRegistry,
    @Inject(PLATFORM_TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(SSO_REPOSITORY) private readonly ssoRepository: SsoRepositoryPort,
    @Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    private readonly organizationsService: OrganizationsService,
    private readonly issueSessionUseCase: IssueSessionUseCase,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(input: HandleSsoCallbackCommand, requestContext?: RequestContext) {
    const provider = this.providers.get(input.provider);

    if (!provider) {
      throw new AppError(
        SSO_ERROR_CODES.SSO_PROVIDER_UNAVAILABLE,
        `SSO provider "${input.provider}" is not available`,
        HttpStatus.NOT_FOUND,
      );
    }

    const loginState = await this.ssoRepository.findValidLoginStateByStateHash(
      hashOpaqueToken(input.state),
    );

    if (loginState?.provider !== input.provider) {
      throw new AppError(
        SSO_ERROR_CODES.SSO_STATE_INVALID,
        "SSO login state is invalid or expired",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // CAS-consume the one-time state BEFORE any side effect: a false result
    // means a concurrent request already replayed this state, so the callback
    // must abort instead of running the login flow twice (TOCTOU guard).
    const stateConsumed = await this.ssoRepository.consumeLoginState(loginState.id);

    if (!stateConsumed) {
      throw new AppError(
        SSO_ERROR_CODES.SSO_STATE_INVALID,
        "SSO login state was already used",
        HttpStatus.UNAUTHORIZED,
      );
    }

    let identity: Awaited<ReturnType<typeof provider.verifyIdToken>>;

    try {
      const tokenSet = await provider.exchangeCode({
        code: input.code,
        codeVerifier: loginState.codeVerifier,
      });
      identity = await provider.verifyIdToken(tokenSet.idToken, loginState.nonce);
    } catch (error) {
      await this.auditWriter.log({
        action: "auth.sso.failed",
        entityType: "user",
        metadata: {
          provider: input.provider,
          reason: error instanceof Error ? error.message : "unknown error",
        },
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      });

      throw new AppError(
        SSO_ERROR_CODES.SSO_TOKEN_INVALID,
        "Failed to verify SSO identity",
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!identity.email) {
      throw new AppError(
        SSO_ERROR_CODES.SSO_TOKEN_INVALID,
        "Provider did not return an email address",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const email = normalizeEmail(identity.email);

    const user = await this.transactionPort.run(async (transaction) => {
      const existingIdentity = await this.ssoRepository.findIdentity(
        input.provider,
        identity.subject,
        transaction,
      );

      if (existingIdentity) {
        const linkedUser = await this.usersRepository.findById(
          existingIdentity.userId,
          transaction,
        );

        if (!linkedUser) {
          throw new AppError(
            USER_ERROR_CODES.USER_NOT_FOUND,
            "Linked user not found",
            HttpStatus.UNAUTHORIZED,
          );
        }

        return linkedUser;
      }

      const existingUserByEmail = await this.usersRepository.findByEmail(email, transaction);
      const decision = decideAccountLinking({
        existingUserByEmail: existingUserByEmail
          ? {
              id: existingUserByEmail.id,
              emailVerifiedAt: existingUserByEmail.emailVerifiedAt,
            }
          : null,
      });

      if (decision.kind === "conflict") {
        throw new AppError(
          SSO_ERROR_CODES.SSO_EMAIL_CONFLICT,
          "An account with this email already exists. Verify your email or sign in with a password first.",
          HttpStatus.CONFLICT,
        );
      }

      if (!identity.emailVerified) {
        throw new AppError(
          SSO_ERROR_CODES.SSO_TOKEN_INVALID,
          "Provider did not verify the email address",
          HttpStatus.UNAUTHORIZED,
        );
      }

      let targetUser;

      if (decision.kind === "link_existing") {
        targetUser = existingUserByEmail!;
      } else {
        targetUser = await this.usersRepository.create(
          {
            email,
            passwordHash: await hashPassword(generateOpaqueToken()),
            displayName: email.split("@")[0] ?? email,
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
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

        await this.accessControlService.replaceUserRoles(
          targetUser.id,
          [userRole.id],
          null,
          transaction,
        );

        await this.organizationsService.ensurePersonalOrganization(
          targetUser.id,
          targetUser.displayName,
          transaction,
        );
      }

      await this.ssoRepository.createIdentity(
        {
          userId: targetUser.id,
          provider: input.provider,
          providerSubject: identity.subject,
          email,
        },
        transaction,
      );

      await this.auditWriter.log(
        {
          actorId: targetUser.id,
          action: decision.kind === "create_new" ? "auth.sso.signup" : "auth.sso.linked",
          entityType: "user",
          entityId: targetUser.id,
          metadata: { provider: input.provider },
          requestContext,
          scope: SYSTEM_SCOPE.PLATFORM,
        },
        transaction,
      );

      return targetUser;
    });

    const session = await this.issueSessionUseCase.execute(user, requestContext);

    await this.auditWriter.log({
      actorId: user.id,
      action: "auth.sso.login_succeeded",
      entityType: "user",
      entityId: user.id,
      metadata: { provider: input.provider },
      requestContext,
      scope: SYSTEM_SCOPE.PLATFORM,
    });

    return { session, redirectUri: loginState.redirectUri };
  }
}
