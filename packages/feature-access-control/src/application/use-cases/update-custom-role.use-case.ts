import type { AuthenticatedRequestUser, JsonValue, RequestContext } from "@repo/api-runtime";
import type { TransactionExecutor, TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ERROR_CODES } from "@repo/api-runtime";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-runtime";
import { ACCESS_CONTROL_ERROR_CODES } from "@repo/feature-access-control/contracts";
import { AuditWriter } from "@repo/feature-audit/contracts";
import { AUDIT_WRITER } from "@repo/feature-audit/contracts";

import type { PermissionView, RoleView, UpdateRoleCommand } from "../access-control.types";

import { isFixedRoleName } from "../../access-control.constants";
import { ROLE_NAMES } from "../../access-control.constants";
import { assertCanModifyCustomRole } from "../../domain/role-assignment.policy";
import { AccessControlMapper } from "../access-control.mapper";
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../ports/access-control.repository.port";
import { AccessProfileUseCase } from "./access-profile.use-case";

function normalizeRoleName(name: string): string {
  return name.trim().toUpperCase();
}

@Injectable()
export class UpdateCustomRoleUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly accessProfileUseCase: AccessProfileUseCase,
    private readonly accessControlMapper: AccessControlMapper,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    roleId: string,
    command: UpdateRoleCommand,
    requestContext?: RequestContext,
  ): Promise<RoleView> {
    try {
      return await this.transactionPort.run(async (tx) => {
        const role = await this.accessControlRepository.findRoleById(roleId, tx);
        if (!role)
          throw new AppError(
            ACCESS_CONTROL_ERROR_CODES.ROLE_NOT_FOUND,
            "Role not found",
            HttpStatus.NOT_FOUND,
          );
        assertCanModifyCustomRole(actor, role);
        const newName = command.name !== undefined ? normalizeRoleName(command.name) : undefined;
        if (newName !== undefined && newName !== role.name) {
          if (isFixedRoleName(newName))
            throw new AppError(
              ERROR_CODES.VALIDATION_FAILED,
              "Custom roles cannot use system role names",
              HttpStatus.BAD_REQUEST,
            );
          const existingRole = await this.accessControlRepository.findRoleByName(
            newName,
            role.organizationId,
            tx,
          );
          if (existingRole && existingRole.id !== role.id)
            throw new AppError(
              ERROR_CODES.RESOURCE_CONFLICT,
              "A role with this name already exists in the organization",
              HttpStatus.CONFLICT,
            );
        }
        let updatedRole;
        try {
          updatedRole = await this.accessControlRepository.updateRole(
            roleId,
            {
              ...(newName !== undefined ? { name: newName } : {}),
              ...(command.description !== undefined ? { description: command.description } : {}),
            },
            tx,
          );
        } catch (error) {
          const pgError = error as { code?: string; cause?: { code?: string }; message?: string };
          if (
            pgError.code === "23505" ||
            pgError.cause?.code === "23505" ||
            pgError.message?.includes("roles_organization_id_name_unique") ||
            pgError.message?.includes("duplicate key value")
          )
            throw new AppError(
              ERROR_CODES.RESOURCE_CONFLICT,
              "A role with this name already exists in the organization",
              HttpStatus.CONFLICT,
            );
          throw error;
        }
        if (!updatedRole)
          throw new AppError(
            ERROR_CODES.INTERNAL_ERROR,
            "Custom role could not be updated",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        let permissions: PermissionView[] = [];
        if (command.permissionIds) {
          permissions = await this.resolveCatalogPermissions(
            actor,
            command.permissionIds,
            role.organizationId,
            tx,
          );
          await this.accessControlRepository.replaceRolePermissions(
            roleId,
            permissions.map((p) => p.id),
            tx,
          );
          await this.accessProfileUseCase.invalidateUsersForRole(roleId, tx);
        } else permissions = await this.loadPermissionsForRole(roleId, tx);
        const updateMeta: Record<string, JsonValue> = {};
        if (newName !== undefined) updateMeta.name = newName;
        if (command.permissionIds) updateMeta.permissionIds = command.permissionIds;
        await this.auditWriter.log(
          {
            actorId: actor.userId,
            action: "role.updated",
            entityType: "role",
            entityId: roleId,
            metadata: updateMeta,
            ...(requestContext ? { requestContext } : {}),
            ...(role.organizationId
              ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: role.organizationId }
              : { scope: SYSTEM_SCOPE.PLATFORM }),
          },
          tx,
        );
        return this.accessControlMapper.toRoleView(
          updatedRole,
          permissions.map((p) => this.accessControlMapper.toPermissionView(p)),
        );
      });
    } catch (error) {
      const pgError = error as { code?: string; constraint?: string };
      if (pgError.code === "23505" && pgError.constraint === "roles_organization_name_lower_unique")
        throw new AppError(
          ERROR_CODES.RESOURCE_CONFLICT,
          "A role with this name already exists in the organization",
          HttpStatus.CONFLICT,
        );
      throw error;
    }
  }

  private async resolveCatalogPermissions(
    actor: AuthenticatedRequestUser,
    permissionIds: string[],
    targetOrganizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<PermissionView[]> {
    const permissions = await this.accessControlRepository.findPermissionsByIds(
      permissionIds,
      executor,
    );
    if (permissions.length !== permissionIds.length)
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "One or more permissions do not exist",
        HttpStatus.BAD_REQUEST,
      );
    const invalidPermission = permissions.find((p) => !p.isSystem);
    if (invalidPermission)
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "Custom roles can only use system catalog permissions",
        HttpStatus.BAD_REQUEST,
      );
    const isOrgScoped = targetOrganizationId !== null;
    for (const permission of permissions)
      if (isOrgScoped && permission.scope === "platform")
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          `Permission "${permission.name}" is platform-scoped and cannot be assigned to organization roles`,
          HttpStatus.FORBIDDEN,
        );
    if (!actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
      const actorPermissionSet = new Set(actor.permissions ?? []);
      for (const permission of permissions)
        if (!actorPermissionSet.has(permission.name))
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            `You do not have the "${permission.name}" permission to delegate it`,
            HttpStatus.FORBIDDEN,
          );
    }
    return permissions.map((p) => this.accessControlMapper.toPermissionView(p as PermissionView));
  }

  private async loadPermissionsForRole(
    roleId: string,
    executor?: TransactionExecutor,
  ): Promise<PermissionView[]> {
    const permissionIds = await this.accessControlRepository.findPermissionIdsForRole(
      roleId,
      executor,
    );
    const rows = await this.accessControlRepository.findPermissionsByIds(permissionIds, executor);
    return rows.map((p) => this.accessControlMapper.toPermissionView(p as PermissionView));
  }
}
