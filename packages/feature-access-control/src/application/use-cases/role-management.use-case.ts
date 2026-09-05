import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionExecutor } from "@repo/api-kernel";

import { Injectable } from "@nestjs/common";

import type { CreateRoleCommand, RoleView, UpdateRoleCommand } from "../access-control.types";

import { CreateCustomRoleUseCase } from "./create-custom-role.use-case";
import { DeleteCustomRoleUseCase } from "./delete-custom-role.use-case";
import { EnsureOrganizationAdminRoleUseCase } from "./ensure-organization-admin-role.use-case";
import { UpdateCustomRoleUseCase } from "./update-custom-role.use-case";

/**
 * Facade preserving the original RoleManagementUseCase surface.
 * Delegates to focused use cases to keep each file <300 lines.
 */
@Injectable()
export class RoleManagementUseCase {
  constructor(
    private readonly createCustomRoleUseCase: CreateCustomRoleUseCase,
    private readonly updateCustomRoleUseCase: UpdateCustomRoleUseCase,
    private readonly deleteCustomRoleUseCase: DeleteCustomRoleUseCase,
    private readonly ensureOrganizationAdminRoleUseCase: EnsureOrganizationAdminRoleUseCase,
  ) {}

  ensureOrganizationAdminRole(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    return this.ensureOrganizationAdminRoleUseCase.execute(organizationId, userId, executor);
  }

  createCustomRole(
    actor: AuthenticatedRequestUser,
    command: CreateRoleCommand,
    requestContext?: RequestContext,
  ): Promise<RoleView> {
    return this.createCustomRoleUseCase.execute(actor, command, requestContext);
  }

  updateCustomRole(
    actor: AuthenticatedRequestUser,
    roleId: string,
    command: UpdateRoleCommand,
    requestContext?: RequestContext,
  ): Promise<RoleView> {
    return this.updateCustomRoleUseCase.execute(actor, roleId, command, requestContext);
  }

  replaceCustomRolePermissions(
    actor: AuthenticatedRequestUser,
    roleId: string,
    permissionIds: string[],
    requestContext?: RequestContext,
  ): Promise<RoleView> {
    return this.updateCustomRoleUseCase.execute(actor, roleId, { permissionIds }, requestContext);
  }

  deleteCustomRole(
    actor: AuthenticatedRequestUser,
    roleId: string,
    requestContext?: RequestContext,
  ): Promise<void> {
    return this.deleteCustomRoleUseCase.execute(actor, roleId, requestContext);
  }
}
