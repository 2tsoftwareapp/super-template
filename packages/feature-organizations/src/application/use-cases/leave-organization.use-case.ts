import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable, Optional } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import type { OrganizationMembership } from "../../public/contracts";
import type { OrganizationAccessControlPort } from "../../public/contracts";

import { assertNotLastOwner } from "../../domain/organization-access.policy";
import { ORGANIZATION_ACCESS_CONTROL } from "../../public/organization-access-control.token";
import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";

@Injectable()
export class LeaveOrganizationUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    @Optional() private readonly accessControl: OrganizationAccessControlPort,
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
          ERROR_CODES.AUTH_FORBIDDEN,
          "You are not a member of this organization",
          HttpStatus.FORBIDDEN,
        );
      }

      if (membership.role === "OWNER") {
        const remainingOwners = await this.membership.countOwners(organizationId, {
          excludingUserId: userId,
          executor: transaction,
          lock: true,
        });
        assertNotLastOwner({ userId, role: membership.role }, remainingOwners);
      }

      const removed = await this.membership.removeMember(organizationId, userId, transaction);

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

import { ERROR_CODES } from "@repo/api-runtime";
import { ORGANIZATION_ERROR_CODES } from "@repo/feature-organizations/contracts";
