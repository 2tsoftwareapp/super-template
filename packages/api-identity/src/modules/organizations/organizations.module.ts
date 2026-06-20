import { Module } from '@nestjs/common';
import { ORGANIZATION_LOOKUP } from '@repo/api-core';

import { AccessControlModule } from '../access-control/access-control.module';
import { OrganizationsService } from './application/organizations.service';
import { AssertOrganizationMembershipUseCase } from './application/use-cases/assert-organization-membership.use-case';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { EnsurePersonalOrganizationUseCase } from './application/use-cases/ensure-personal-organization.use-case';
import { ListOrganizationsForUserUseCase } from './application/use-cases/list-organizations-for-user.use-case';
import { ResolveOrganizationIdForUserUseCase } from './application/use-cases/resolve-organization-id-for-user.use-case';
import { OrganizationsRepository } from './infrastructure/organizations.repository';
import { OrganizationsController } from './presentation/organizations.controller';

@Module({
  imports: [AccessControlModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsRepository,
    OrganizationsService,
    ListOrganizationsForUserUseCase,
    CreateOrganizationUseCase,
    EnsurePersonalOrganizationUseCase,
    AssertOrganizationMembershipUseCase,
    ResolveOrganizationIdForUserUseCase,
    {
      provide: ORGANIZATION_LOOKUP,
      useExisting: OrganizationsRepository,
    },
  ],
  exports: [
    OrganizationsRepository,
    OrganizationsService,
    ORGANIZATION_LOOKUP,
  ],
})
export class OrganizationsModule {}
