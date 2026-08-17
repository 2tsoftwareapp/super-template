import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-core";
import type { TransactionPort } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  ROLE_NAMES,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
} from "@repo/api-core";

import { AccessControlService } from "../../../access-control/application/access-control.service";
import { assertOrganizationRole } from "../../domain/organization-access.policy";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

@Injectable()
export class DeleteOrganizationUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly accessControlService: AccessControlService,
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
            isSuperAdmin: actor.roles?.includes(ROLE_NAMES.SUPER_ADMIN) ?? false,
          };

    const tenantContext = {
      tenantId: organizationId,
      userId: actorUserId,
      bypassRls: isSuperAdmin,
    };

    await this.transactionPort.withTenant(tenantContext, async (transaction) => {
      if (!isSuperAdmin) {
        const membership = await this.organizationsRepository.findMembership(
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
          ERROR_CODES.ORGANIZATION_NOT_FOUND,
          "Organization not found",
          HttpStatus.NOT_FOUND,
        );
      }

      // Lock owner rows for concurrency safety
      await this.organizationsRepository.countOwners(organizationId, {
        executor: transaction,
        lock: true,
      });

      // Fetch all organization members to clean up their sessions and access profiles
      const members = await this.organizationsRepository.listMembers(organizationId, transaction);

      // Perform soft delete first so the organization is marked deleted
      const deleted = await this.organizationsRepository.softDeleteOrganization(
        organizationId,
        transaction,
      );

      if (!deleted) {
        throw new AppError(
          ERROR_CODES.ORGANIZATION_NOT_FOUND,
          "Organization not found",
          HttpStatus.NOT_FOUND,
        );
      }

      // Clean up memberships and organization-scoped roles from the DB
      await this.organizationsRepository.deleteOrganizationMembershipsAndRoles(
        organizationId,
        transaction,
      );

      // Clean up each member's cache
      for (const member of members) {
        await this.accessControlService.invalidateAccessProfile(member.userId);
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
