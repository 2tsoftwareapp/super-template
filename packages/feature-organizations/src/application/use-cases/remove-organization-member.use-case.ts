import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  ERROR_CODES,
  ROLE_NAMES,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
} from "@repo/api-runtime";
import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";

import {
  assertCanManageTargetRole,
  assertNotLastOwner,
  assertOrganizationRole,
} from "../../domain/organization-access.policy";
import { ORGANIZATION_MEMBERSHIP, type OrganizationMembership } from "../../public/contracts";
import { AUDIT_WRITER } from "@repo/feature-audit/contracts";
import type { AuditWriter } from "@repo/feature-audit/contracts";

import {
  ORGANIZATION_ACCESS_CONTROL,
  type OrganizationAccessControlPort,
} from "../../public/contracts";

@Injectable()
export class RemoveOrganizationMemberUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
  ) {}

  async execute(
    organizationId: string,
    actor: string | AuthenticatedRequestUser,
    targetUserId: string,
    requestContext?: RequestContext,
  ): Promise<void> {
    const { userId: actorUserId, isSuperAdmin } =
      typeof actor === "string"
        ? { userId: actor, isSuperAdmin: false }
        : {
            userId: actor.userId,
            isSuperAdmin: actor.roles?.includes(ROLE_NAMES.SUPER_ADMIN) ?? false,
          };

    const tenantContext = {
      tenantId: organizationId,
      userId: actorUserId,
      bypassRls: isSuperAdmin,
    };

    await this.transactionPort.withTenant(tenantContext, async (transaction) => {
      if (!isSuperAdmin) {
        const actorMembership = await this.membership.findMembership(
          organizationId,
          actorUserId,
          transaction,
        );

        if (!actorMembership) {
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            "You are not a member of this organization",
            HttpStatus.FORBIDDEN,
          );
        }

        assertOrganizationRole(actorMembership, ["OWNER", "ADMIN"]);

        const targetMembership = await this.membership.findMembership(
          organizationId,
          targetUserId,
          transaction,
        );

        if (!targetMembership) {
          throw new AppError(
            ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
            "This user is not a member of the organization",
            HttpStatus.NOT_FOUND,
          );
        }

        assertCanManageTargetRole(actorMembership.role, targetMembership.role);
      }

      const targetMembership = await this.membership.findMembership(
        organizationId,
        targetUserId,
        transaction,
      );

      if (!targetMembership) {
        throw new AppError(
          ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
          "This user is not a member of the organization",
          HttpStatus.NOT_FOUND,
        );
      }

      if (targetMembership.role === "OWNER") {
        const remainingOwners = await this.membership.countOwners(organizationId, {
          excludingUserId: targetUserId,
          executor: transaction,
          lock: true,
        });
        assertNotLastOwner({ userId: targetUserId, role: targetMembership.role }, remainingOwners);
      }

      const removed = await this.membership.removeMember(organizationId, targetUserId, transaction);

      if (!removed) {
        throw new AppError(
          ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
          "This user is not a member of the organization",
          HttpStatus.NOT_FOUND,
        );
      }

      // Cleanup user roles scoped to organization
      await this.accessControl.replaceUserRoles(targetUserId, [], organizationId, transaction);

      // Invalidate access profile cache
      await this.accessControl.invalidateAccessProfile(targetUserId);

      await this.auditWriter.log(
        {
          actorId: actorUserId,
          action: "organization.member.remove",
          entityType: "organization_member",
          entityId: targetUserId,
          metadata: { organizationId },
          requestContext,
          ...(organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        transaction,
      );

      await this.activityEmitter.emit(
        {
          organizationId,
          summary: "Member removed from organization",
          entityType: "organization",
          entityId: organizationId,
          actorId: actorUserId,
          visibility: "INTERNAL",
          metadata: { targetUserId },
        },
        transaction,
      );
    });
  }
}
