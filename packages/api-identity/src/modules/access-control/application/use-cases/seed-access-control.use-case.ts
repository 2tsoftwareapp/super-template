import type { TransactionExecutor } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, permissionNamesForRole, ROLE_NAMES } from "@repo/api-core";

import {
  PERMISSION_SEED_ENTRIES,
  ROLE_SEED_ENTRIES,
} from "../../domain/access-control-seed.catalog";
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../access-control.repository.port";
import { AccessProfileUseCase } from "./access-profile.use-case";

@Injectable()
export class SeedAccessControlUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileUseCase: AccessProfileUseCase,
  ) {}

  async execute(executor?: TransactionExecutor): Promise<void> {
    // Ensure platform roles exist first (idempotent insert).
    await this.accessControlRepository.ensureRoles(ROLE_SEED_ENTRIES, executor);

    // Resolve each fixed role with explicit platform scope (organization_id IS NULL).
    // Using findRoleByName with organizationId=null is critical: findRolesByNames
    // might return organization-scoped ADMIN rows from other tenants, and
    // keying by name alone would select the wrong row (C-001).
    const superAdminRole = await this.accessControlRepository.findRoleByName(
      ROLE_NAMES.SUPER_ADMIN,
      null,
      executor,
    );
    const adminRole = await this.accessControlRepository.findRoleByName(
      ROLE_NAMES.ADMIN,
      null,
      executor,
    );
    const userRole = await this.accessControlRepository.findRoleByName(
      ROLE_NAMES.USER,
      null,
      executor,
    );

    if (!superAdminRole || !adminRole || !userRole) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Role seed state is inconsistent",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const permissions = await this.accessControlRepository.ensurePermissions(
      PERMISSION_SEED_ENTRIES,
      executor,
    );

    const permissionByName = new Map(
      permissions.map((permission) => [permission.name, permission]),
    );

    const resolvePermissionIds = (names: string[]) =>
      names
        .map((name) => permissionByName.get(name)?.id)
        .filter((id): id is string => typeof id === "string");

    await this.accessControlRepository.replaceRolePermissions(
      superAdminRole.id,
      resolvePermissionIds(permissionNamesForRole(ROLE_NAMES.SUPER_ADMIN)),
      executor,
    );
    await this.accessControlRepository.replaceRolePermissions(
      adminRole.id,
      resolvePermissionIds(permissionNamesForRole(ROLE_NAMES.ADMIN)),
      executor,
    );
    await this.accessControlRepository.replaceRolePermissions(
      userRole.id,
      resolvePermissionIds(permissionNamesForRole(ROLE_NAMES.USER)),
      executor,
    );

    await this.accessProfileUseCase.invalidateUsersForRole(superAdminRole.id, executor);
    await this.accessProfileUseCase.invalidateUsersForRole(adminRole.id, executor);
    await this.accessProfileUseCase.invalidateUsersForRole(userRole.id, executor);
  }
}
