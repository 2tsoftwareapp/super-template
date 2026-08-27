import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-runtime";
import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import type { OrganizationMembership } from "../../public/contracts";

import { assertOrganizationRole } from "../../domain/organization-access.policy";
import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

/** Platform super-role literal; importing access-control here would create a package cycle. */
const PLATFORM_SUPER_ADMIN = "SUPER_ADMIN";

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
  ) {}

  async execute(
    organizationId: string,
    actor: string | AuthenticatedRequestUser,
    input: { name: string },
    requestContext?: RequestContext,
  ) {
    const { userId: actorUserId, isSuperAdmin } =
      typeof actor === "string"
        ? { userId: actor, isSuperAdmin: false }
        : {
            userId: actor.userId,
            isSuperAdmin: actor.roles?.includes(PLATFORM_SUPER_ADMIN) ?? false,
          };

    let membership = null;
    if (!isSuperAdmin) {
      membership = await this.membership.findMembership(organizationId, actorUserId);

      if (!membership) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          "You are not a member of this organization",
          HttpStatus.FORBIDDEN,
        );
      }

      assertOrganizationRole(membership, ["OWNER", "ADMIN"]);
    }

    const tenantContext = {
      tenantId: organizationId,
      userId: actorUserId,
      bypassRls: isSuperAdmin,
    };

    const result = await this.transactionPort.withTenant(tenantContext, async (transaction) => {
      const organization = await this.organizationsRepository.updateOrganization(
        organizationId,
        { name: input.name.trim() },
        transaction,
      );

      if (!organization) {
        throw new AppError(
          ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND,
          "Organization not found",
          HttpStatus.NOT_FOUND,
        );
      }

      await this.auditWriter.log(
        {
          actorId: actorUserId,
          action: "organization.update",
          entityType: "organization",
          entityId: organizationId,
          metadata: { name: organization.name },
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
          summary: `Organization renamed to "${organization.name}"`,
          entityType: "organization",
          entityId: organizationId,
          actorId: actorUserId,
          visibility: "INTERNAL",
        },
        transaction,
      );

      return organization;
    });

    return {
      id: result.id,
      name: result.name,
      slug: result.slug,
      role: membership?.role ?? ("ADMIN" as const),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }
}

import { ERROR_CODES } from "@repo/api-runtime";
import { ORGANIZATION_ERROR_CODES } from "@repo/feature-organizations/contracts";
