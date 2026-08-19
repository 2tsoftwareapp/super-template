import type { TransactionExecutor } from "@repo/api-core";

import { Inject, Injectable } from "@nestjs/common";

import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../access-control.repository.port";
import { AccessProfileUseCase } from "./access-profile.use-case";

@Injectable()
export class ReplaceUserRolesUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileUseCase: AccessProfileUseCase,
  ) {}

  async execute(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<void> {
    await this.accessControlRepository.replaceUserRoles(userId, roleIds, organizationId, executor);
    await this.accessProfileUseCase.invalidateAccessProfile(userId);
  }
}
