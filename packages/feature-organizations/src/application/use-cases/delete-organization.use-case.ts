import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import type { OrganizationMembership } from "../../public/contracts";
import type { OrganizationAccessControlPort } from "../../public/contracts";

import { assertOrganizationRole } from "../../domain/organization-access.policy";
import { ORGANIZATION_ACCESS_CONTROL } from "../../public/organization-access-control.token";
import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

/** Platform super-role literal; importing access-control here would create a package cycle. */
const PLATFORM_SUPER_ADMIN = "SUPER_ADMIN";

@Injectable()
export class DeleteOrganizationUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
  ) {}

  async execute(
    organizationId: string,
    actor: string | AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ): Promise<void> {
    const { userId: actorUserId, isSuperAdmin } =
      typeof actor === "string"
        ? { userId: actor, isSuperAdmin: false }
        : {
            userId: actor.userId,
            isSuperAdmin: actor.roles?.includes(PLATFORM_SUPER_ADMIN) ?? false,
          };

    const tenantContext = {
      tenantId: organizationId,
      userId: actorUserId,
      bypassRls: isSuperAdmin,
    };

    await this.transactionPort.withTenant(tenantContext, async (transaction) => {
      if (!isSuperAdmin) {
        const membership = await this.membership.findMembership(
          organizationId,
          actorUserId,
          transaction,
        );

        if (!membership) {
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            "You are not a member of this organization",
            HttpStatus.FORBIDDEN,
          );
        }

        assertOrganizationRole(membership, ["OWNER"]);
      }

      const org = await this.organizationsRepository.findById(organizationId, transaction);
      if (!org) {
        throw new AppError(
          ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND,
          "Organization not found",
          HttpStatus.NOT_FOUND,
        );
      }

      // Lock owner rows for concurrency safety
      await this.membership.countOwners(organizationId, {
        executor: transaction,
        lock: true,
      });

      // Fetch all organization members to clean up their sessions and access profiles
      const members = await this.membership.listMembers(organizationId, transaction);

      // Perform soft delete first so the organization is marked deleted
      const deleted = await this.organizationsRepository.softDeleteOrganization(
        organizationId,
        transaction,
      );

      if (!deleted) {
        throw new AppError(
          ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND,
          "Organization not found",
          HttpStatus.NOT_FOUND,
        );
      }

      await this.membership.deleteByOrganizationId(organizationId, transaction);
      await this.organizationsRepository.deleteOrganizationRoles(organizationId, transaction);

      // Clean up each member's cache
      for (const member of members) {
        await this.accessControl.invalidateAccessProfile(member.userId);
      }

      await this.auditWriter.log(
        {
          actorId: actorUserId,
          action: "organization.delete",
          entityType: "organization",
          entityId: organizationId,
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
