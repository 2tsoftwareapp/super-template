import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { AuditWriter } from "@repo/feature-audit/contracts";
import { AUDIT_WRITER } from "@repo/feature-audit/contracts";

import type { CreateRoleCommand, RoleView } from "../access-control.types";

import { isFixedRoleName } from "../../access-control.constants";
import { ROLE_NAMES } from "../../access-control.constants";
import { assertCanCreateCustomRole } from "../../domain/role-assignment.policy";
import { AccessControlMapper } from "../access-control.mapper";
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../ports/access-control.repository.port";
import { CatalogPermissionResolver } from "../services/catalog-permission-resolver.service";

function normalizeRoleName(name: string): string {
  return name.trim().toUpperCase();
}

@Injectable()
export class CreateCustomRoleUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly catalogPermissionResolver: CatalogPermissionResolver,
    private readonly accessControlMapper: AccessControlMapper,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    command: CreateRoleCommand,
    requestContext?: RequestContext,
  ): Promise<RoleView> {
    const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);
    const organizationId: string | null = isSuperAdmin
      ? (command.organizationId ?? null)
      : (actor.organizationId ?? null);
    if (isSuperAdmin && !organizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "Organization ID is required when creating a role",
        HttpStatus.BAD_REQUEST,
      );
    }
    assertCanCreateCustomRole(actor, organizationId);
    return this.transactionPort.run(async (tx) => {
      const normalizedName = normalizeRoleName(command.name);
      if (isFixedRoleName(normalizedName))
        throw new AppError(
          ERROR_CODES.VALIDATION_FAILED,
          "Custom roles cannot use system role names",
          HttpStatus.BAD_REQUEST,
        );
      const existingRole = await this.accessControlRepository.findRoleByName(
        normalizedName,
        organizationId,
        tx,
      );
      if (existingRole)
        throw new AppError(
          ERROR_CODES.RESOURCE_CONFLICT,
          "A role with this name already exists in the organization",
          HttpStatus.CONFLICT,
        );
      const permissions = await this.catalogPermissionResolver.resolve({
        actor,
        permissionIds: command.permissionIds,
        targetOrganizationId: organizationId,
        executor: tx,
      });
      const role = await this.accessControlRepository.createRole(
        {
          name: normalizedName,
          description: command.description ?? "",
          organizationId,
          isSystem: false,
        },
        tx,
      );
      if (!role) {
        const existing = await this.accessControlRepository.findRoleByName(
          normalizedName,
          organizationId,
          tx,
        );
        if (existing)
          throw new AppError(
            ERROR_CODES.RESOURCE_CONFLICT,
            "A role with this name already exists in the organization",
            HttpStatus.CONFLICT,
          );
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          "Custom role could not be created",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      await this.accessControlRepository.replaceRolePermissions(
        role.id,
        permissions.map((p) => p.id),
        tx,
      );
      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "role.created",
          entityType: "role",
          entityId: role.id,
          metadata: { name: normalizedName, organizationId, permissionIds: command.permissionIds },
          ...(requestContext ? { requestContext } : {}),
          ...(organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        tx,
      );
      return this.accessControlMapper.toRoleView(
        role,
        permissions.map((p) => this.accessControlMapper.toPermissionView(p)),
      );
    });
  }
}
