import type { AuthenticatedRequestUser, TransactionExecutor } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import type { PermissionView } from "../access-control.types";

import { assertDelegableCatalogPermissions } from "../../domain/role-permission-catalog.policy";
import { AccessControlMapper } from "../access-control.mapper";
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../ports/access-control.repository.port";

export interface ResolveCatalogPermissionsInput {
  actor: AuthenticatedRequestUser;
  permissionIds: string[];
  targetOrganizationId: string | null;
  executor?: TransactionExecutor;
}

/**
 * Shared resolver for the permission set of a custom role.
 *
 * Lives in `application/` (not `domain/`) because it needs the permission
 * catalog from the repository and the response mapper — the framework-free
 * decision rules it applies are extracted into
 * `domain/role-permission-catalog.policy`. Both create- and update-custom-role
 * call this single implementation so the checks cannot drift apart again.
 */
@Injectable()
export class CatalogPermissionResolver {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessControlMapper: AccessControlMapper,
  ) {}

  async resolve(input: ResolveCatalogPermissionsInput): Promise<PermissionView[]> {
    const permissions = await this.accessControlRepository.findPermissionsByIds(
      input.permissionIds,
      input.executor,
    );

    if (permissions.length !== input.permissionIds.length) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "One or more permissions do not exist",
        HttpStatus.BAD_REQUEST,
      );
    }

    assertDelegableCatalogPermissions({
      actor: input.actor,
      targetOrganizationId: input.targetOrganizationId,
      permissions,
    });

    return permissions.map((permission) =>
      this.accessControlMapper.toPermissionView(permission as PermissionView),
    );
  }
}
