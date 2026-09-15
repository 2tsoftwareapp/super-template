import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-kernel";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import {
  ORGANIZATION_ACCESS_CONTROL,
  ORGANIZATION_ERROR_CODES,
  ORGANIZATION_MEMBERSHIP,
  type OrganizationAccessControlPort,
  type OrganizationMembership,
} from "@repo/feature-organizations/contracts";

import { LastOwnerGuard } from "../services/last-owner-guard.service";

@Injectable()
export class LeaveOrganizationUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
    private readonly lastOwnerGuard: LastOwnerGuard,
  ) {}

  async execute(
    organizationId: string,
    actor: string | AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ): Promise<void> {
    const userId = typeof actor === "string" ? actor : actor.userId;

    const tenantContext = {
      tenantId: organizationId,
      userId,
      bypassRls: false,
    };

    await this.transactionPort.withTenant(tenantContext, async (transaction) => {
      const membership = await this.membership.findMembership(organizationId, userId, transaction);

      if (!membership) {
        throw new AppError(
          "AUTH_FORBIDDEN",
          "You are not a member of this organization",
          HttpStatus.FORBIDDEN,
        );
      }

      const removed = await this.lastOwnerGuard.run(
        organizationId,
        { userId, currentRole: membership.role },
        transaction,
        () => this.membership.removeMember(organizationId, userId, transaction),
      );

      if (!removed) {
        throw new AppError(
          ORGANIZATION_ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
          "You are not a member of this organization",
          HttpStatus.NOT_FOUND,
        );
      }

      // Cleanup user roles scoped to organization
      await this.accessControl.replaceUserRoles(userId, [], organizationId, transaction);

      // Invalidate access profile cache
      await this.accessControl.invalidateAccessProfile(userId);

      await this.auditWriter.log(
        {
          actorId: userId,
          action: "organization.leave",
          entityType: "organization_member",
          entityId: userId,
          metadata: { organizationId },
          requestContext,
          ...(organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        transaction,
      );
    });
  }
}
