import type { RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ERROR_CODES } from "@repo/api-runtime";
import { AppError, normalizeEmail, SYSTEM_SCOPE } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
import { AUTH_USER_STORE, type AuthUserStore } from "@repo/feature-auth/contracts";
import { MfaService } from "@repo/feature-mfa/contracts";

import type { LoginCommand } from "../auth.types";

import { verifyPasswordWithTimingPadding } from "../auth.helpers";
import { IssueSessionUseCase } from "./issue-session.use-case";

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly issueSessionUseCase: IssueSessionUseCase,
    private readonly mfaService: MfaService,
  ) {}

  async execute(input: LoginCommand, requestContext?: RequestContext) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);
    const passwordMatches = await verifyPasswordWithTimingPadding(
      user?.passwordHash,
      input.password,
    );

    if (!user || !passwordMatches) {
      await this.auditWriter.log({
        ...(user ? { actorId: user.id, entityId: user.id } : {}),
        action: "auth.login.failed",
        entityType: "user",
        metadata: { email },
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      });
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        "Invalid email or password",
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === "BLOCKED") {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Your account is blocked",
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.status === "PENDING" || !user.emailVerifiedAt) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Verify your email before logging in",
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.mustChangePassword) {
      const session = await this.issueSessionUseCase.execute(user, requestContext, {
        mustChangePassword: true,
      });

      await this.auditWriter.log({
        actorId: user.id,
        action: "auth.login.must_change_password",
        entityType: "user",
        entityId: user.id,
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      });

      return { mfaRequired: false as const, ...session };
    }

    if (await this.mfaService.isEnabled(user.id)) {
      const mfaToken = await this.mfaService.createLoginChallenge(user.id, {
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      });

      await this.auditWriter.log({
        actorId: user.id,
        action: "auth.login.mfa_challenge_issued",
        entityType: "user",
        entityId: user.id,
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      });

      return {
        mfaRequired: true as const,
        mfaToken,
      };
    }

    const session = await this.issueSessionUseCase.execute(user, requestContext);

    await this.auditWriter.log({
      actorId: user.id,
      action: "auth.login.succeeded",
      entityType: "user",
      entityId: user.id,
      requestContext,
      scope: SYSTEM_SCOPE.PLATFORM,
    });

    return { mfaRequired: false as const, ...session };
  }
}
