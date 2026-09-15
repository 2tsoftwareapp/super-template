import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, PLATFORM_ROLE_NAMES, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-kernel";
import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import {
  assertCanManageTargetRole,
  assertOrganizationRole,
  ORGANIZATION_ACCESS_CONTROL,
  ORGANIZATION_ERROR_CODES,
  ORGANIZATION_MEMBERSHIP,
  type OrganizationAccessControlPort,
  type OrganizationMemberRole,
  type OrganizationMembership,
} from "@repo/feature-organizations/contracts";

import { LastOwnerGuard } from "../services/last-owner-guard.service";

@Injectable()
export class UpdateMemberRoleUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
    private readonly lastOwnerGuard: LastOwnerGuard,
  ) {}

  async execute(
    organizationId: string,
    actor: string | AuthenticatedRequestUser,
    targetUserId: string,
    role: OrganizationMemberRole,
    requestContext?: RequestContext,
  ) {
    const { userId: actorUserId, isSuperAdmin } =
      typeof actor === "string"
        ? { userId: actor, isSuperAdmin: false }
        : {
            userId: actor.userId,
            isSuperAdmin: actor.roles?.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN) ?? false,
          };

    const tenantContext = {
      tenantId: organizationId,
      userId: actorUserId,
      bypassRls: isSuperAdmin,
    };

    return this.transactionPort.withTenant(tenantContext, async (transaction) => {
      if (!isSuperAdmin) {
        const actorMembership = await this.membership.findMembership(
          organizationId,
          actorUserId,
          transaction,
        );

        if (!actorMembership) {
          throw new AppError(
            "AUTH_FORBIDDEN",
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
            ORGANIZATION_ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
            "This user is not a member of the organization",
            HttpStatus.NOT_FOUND,
          );
        }

        assertCanManageTargetRole(actorMembership.role, targetMembership.role);
        assertCanManageTargetRole(actorMembership.role, role);
      }

      const targetMembership = await this.membership.findMembership(
        organizationId,
        targetUserId,
        transaction,
      );

      if (!targetMembership) {
        throw new AppError(
          ORGANIZATION_ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
          "This user is not a member of the organization",
          HttpStatus.NOT_FOUND,
        );
      }

      const updated = await this.lastOwnerGuard.run(
        organizationId,
        {
          userId: targetUserId,
          currentRole: targetMembership.role,
          // OWNER → OWNER keeps the owner count, so the last-owner guard does not apply.
          keepsOwnership: role === "OWNER",
        },
        transaction,
        () => this.membership.updateMemberRole(organizationId, targetUserId, role, transaction),
      );

      if (!updated) {
        throw new AppError(
          ORGANIZATION_ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
          "This user is not a member of the organization",
          HttpStatus.NOT_FOUND,
        );
      }

      // Synchronize RBAC roles
      if (role === "MEMBER") {
        await this.accessControl.replaceUserRoles(targetUserId, [], organizationId, transaction);
      } else if (role === "ADMIN" || role === "OWNER") {
        await this.accessControl.ensureOrganizationAdminRole(
          organizationId,
          targetUserId,
          transaction,
        );
      }

      await this.accessControl.invalidateAccessProfile(targetUserId);

      await this.auditWriter.log(
        {
          actorId: actorUserId,
          action: "organization.member.role-update",
          entityType: "organization_member",
          entityId: targetUserId,
          metadata: { organizationId, role },
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
          summary: `Member promoted to ${role}`,
          entityType: "organization",
          entityId: organizationId,
          actorId: actorUserId,
          visibility: "INTERNAL",
          metadata: { targetUserId, role },
        },
        transaction,
      );

      return {
        userId: updated.userId,
        role: updated.role,
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }
}
