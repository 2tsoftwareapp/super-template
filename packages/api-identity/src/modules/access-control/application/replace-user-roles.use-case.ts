import type { DatabaseExecutor } from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';

import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from './access-control.repository.port';
import { AccessProfileUseCase } from './access-profile.use-case';

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
    executor?: DatabaseExecutor,
  ): Promise<void> {
    await this.accessControlRepository.replaceUserRoles(
      userId,
      roleIds,
      executor,
    );
    await this.accessProfileUseCase.invalidateAccessProfile(userId);
  }
}
