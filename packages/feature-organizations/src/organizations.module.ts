import { Global, Module } from "@nestjs/common";

import { OrganizationsService } from "./application/organizations.service";
import { ORGANIZATIONS_REPOSITORY } from "./application/ports/organizations.repository.port";
import { AssertOrganizationMembershipUseCase } from "./application/use-cases/assert-organization-membership.use-case";
import { EnsurePersonalOrganizationUseCase } from "./application/use-cases/ensure-personal-organization.use-case";
import { GetOrganizationUseCase } from "./application/use-cases/get-organization.use-case";
import { ListOrganizationMembersUseCase } from "./application/use-cases/list-organization-members.use-case";
import { ListOrganizationsForUserUseCase } from "./application/use-cases/list-organizations-for-user.use-case";
import { ResolveOrganizationIdForUserUseCase } from "./application/use-cases/resolve-organization-id-for-user.use-case";
import { UpdateOrganizationUseCase } from "./application/use-cases/update-organization.use-case";
import { OrganizationLookupAdapter } from "./infrastructure/organization-lookup.adapter";
import { OrganizationMembersRepository } from "./infrastructure/organization-members.repository";
import { OrganizationsRepository } from "./infrastructure/organizations.repository";
import { OrganizationsController } from "./presentation/organizations.controller";
import { ORGANIZATION_LOOKUP } from "./public/organization-lookup.port";
import { ORGANIZATION_MEMBERSHIP } from "./public/organization-membership.token";

export { OrganizationsService } from "./application/organizations.service";
export { EnsurePersonalOrganizationUseCase } from "./application/use-cases/ensure-personal-organization.use-case";

/**
 * Core organizations module — provides schema, repository, membership queries,
 * and the core personal-organization creation (no RBAC).
 *
 * RBAC-aware personal-organization provisioning is provided by
 * feature-organization-management, which wraps the core use case
 * and exports PERSONAL_ORGANIZATION_PROVISIONER.
 */
@Global()
@Module({
  imports: [],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsRepository,
    {
      provide: ORGANIZATIONS_REPOSITORY,
      useExisting: OrganizationsRepository,
    },
    OrganizationMembersRepository,
    {
      provide: ORGANIZATION_MEMBERSHIP,
      useExisting: OrganizationMembersRepository,
    },
    OrganizationLookupAdapter,
    OrganizationsService,
    ListOrganizationsForUserUseCase,
    GetOrganizationUseCase,
    UpdateOrganizationUseCase,
    AssertOrganizationMembershipUseCase,
    ResolveOrganizationIdForUserUseCase,
    ListOrganizationMembersUseCase,
    EnsurePersonalOrganizationUseCase,
    {
      provide: ORGANIZATION_LOOKUP,
      useExisting: OrganizationLookupAdapter,
    },
  ],
  exports: [
    OrganizationsService,
    ORGANIZATIONS_REPOSITORY,
    ORGANIZATION_MEMBERSHIP,
    ORGANIZATION_LOOKUP,
    GetOrganizationUseCase,
    ListOrganizationsForUserUseCase,
    ListOrganizationMembersUseCase,
    UpdateOrganizationUseCase,
    EnsurePersonalOrganizationUseCase,
  ],
})
export class OrganizationsModule {}
