import { Module } from "@nestjs/common";
import { ORGANIZATION_LOOKUP } from "@repo/api-core";

import { AccessControlModule } from "../access-control";
import { OrganizationsService } from "./application/organizations.service";
import { ORGANIZATIONS_REPOSITORY } from "./application/ports/organizations.repository.port";
import { AssertOrganizationMembershipUseCase } from "./application/use-cases/assert-organization-membership.use-case";
import { CreateOrganizationUseCase } from "./application/use-cases/create-organization.use-case";
import { DeleteOrganizationUseCase } from "./application/use-cases/delete-organization.use-case";
import { EnsurePersonalOrganizationUseCase } from "./application/use-cases/ensure-personal-organization.use-case";
import { GetOrganizationUseCase } from "./application/use-cases/get-organization.use-case";
import { LeaveOrganizationUseCase } from "./application/use-cases/leave-organization.use-case";
import { ListOrganizationMembersUseCase } from "./application/use-cases/list-organization-members.use-case";
import { ListOrganizationsForUserUseCase } from "./application/use-cases/list-organizations-for-user.use-case";
import { RemoveOrganizationMemberUseCase } from "./application/use-cases/remove-organization-member.use-case";
import { ResolveOrganizationIdForUserUseCase } from "./application/use-cases/resolve-organization-id-for-user.use-case";
import { UpdateMemberRoleUseCase } from "./application/use-cases/update-member-role.use-case";
import { UpdateOrganizationUseCase } from "./application/use-cases/update-organization.use-case";
import { OrganizationsRepository } from "./infrastructure/organizations.repository";
import { OrganizationsController } from "./presentation/organizations.controller";

@Module({
  imports: [AccessControlModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsRepository,
    {
      provide: ORGANIZATIONS_REPOSITORY,
      useExisting: OrganizationsRepository,
    },
    OrganizationsService,
    ListOrganizationsForUserUseCase,
    CreateOrganizationUseCase,
    EnsurePersonalOrganizationUseCase,
    AssertOrganizationMembershipUseCase,
    ResolveOrganizationIdForUserUseCase,
    GetOrganizationUseCase,
    UpdateOrganizationUseCase,
    DeleteOrganizationUseCase,
    ListOrganizationMembersUseCase,
    UpdateMemberRoleUseCase,
    RemoveOrganizationMemberUseCase,
    LeaveOrganizationUseCase,
    {
      provide: ORGANIZATION_LOOKUP,
      useExisting: OrganizationsRepository,
    },
  ],
  exports: [OrganizationsService, ORGANIZATIONS_REPOSITORY, ORGANIZATION_LOOKUP],
})
export class OrganizationsModule {}
