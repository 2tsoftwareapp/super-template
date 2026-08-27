import type { TransactionExecutor } from "@repo/api-runtime";
import { ROLE_NAMES } from "../../access-control.constants";

import { Inject, Injectable } from "@nestjs/common";

import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../ports/access-control.repository.port";
import { AccessProfileUseCase } from "./access-profile.use-case";

@Injectable()
export class EnsureOrganizationAdminRoleUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileUseCase: AccessProfileUseCase,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    // Org-admin role receives every organization-scoped permission contributed
    // by the composed feature set (equivalent to the previous central matrix).
    const allPermissions = await this.accessControlRepository.findAllPermissions(executor);
    const permissions = allPermissions.filter((p) => p.scope !== "platform");
    const role = await this.accessControlRepository.ensureOrganizationSystemRole(
      ROLE_NAMES.ADMIN,
      "Organization administrator role",
      organizationId,
      executor,
    );
    await this.accessControlRepository.replaceRolePermissions(
      role.id,
      permissions.map((p) => p.id),
      executor,
    );
    await this.accessControlRepository.assignUserRole(userId, role.id, organizationId, executor);
    await this.accessProfileUseCase.invalidateAccessProfile(userId);
  }
}
