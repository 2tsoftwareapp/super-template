import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { ACCESS_CONTROL_ERROR_CODES } from "@repo/feature-access-control/contracts";
import { AuditWriter } from "@repo/feature-audit/contracts";
import { AUDIT_WRITER } from "@repo/feature-audit/contracts";

import { assertCanModifyCustomRole } from "../../domain/role-assignment.policy";
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../ports/access-control.repository.port";

@Injectable()
export class DeleteCustomRoleUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    roleId: string,
    requestContext?: RequestContext,
  ): Promise<void> {
    return this.transactionPort.run(async (tx) => {
      const role = await this.accessControlRepository.findRoleByIdWithLock(roleId, tx);
      if (!role)
        throw new AppError(
          ACCESS_CONTROL_ERROR_CODES.ROLE_NOT_FOUND,
          "Role not found",
          HttpStatus.NOT_FOUND,
        );
      assertCanModifyCustomRole(actor, role);
      const assignedUserIds = await this.accessControlRepository.findUserIdsForRole(roleId, tx);
      if (assignedUserIds.length > 0)
        throw new AppError(
          ERROR_CODES.RESOURCE_CONFLICT,
          "Custom roles assigned to users cannot be deleted",
          HttpStatus.CONFLICT,
        );
      await this.accessControlRepository.deleteRole(roleId, tx);
      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "role.deleted",
          entityType: "role",
          entityId: roleId,
          metadata: { name: role.name, organizationId: role.organizationId },
          ...(requestContext ? { requestContext } : {}),
          ...(role.organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: role.organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        tx,
      );
    });
  }
}
