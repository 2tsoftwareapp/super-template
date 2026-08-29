import { Module } from "@nestjs/common";
import { AccessControlModule } from "@repo/feature-access-control/module";
import { OrganizationsModule } from "@repo/feature-organizations/module";

import { CreateOrganizationUseCase } from "./application/use-cases/create-organization.use-case";
import { DeleteOrganizationUseCase } from "./application/use-cases/delete-organization.use-case";
import { EnsurePersonalOrganizationUseCase } from "./application/use-cases/ensure-personal-organization.use-case";
import { LeaveOrganizationUseCase } from "./application/use-cases/leave-organization.use-case";
import { RemoveOrganizationMemberUseCase } from "./application/use-cases/remove-organization-member.use-case";
import { UpdateMemberRoleUseCase } from "./application/use-cases/update-member-role.use-case";
import { OrganizationManagementController } from "./presentation/organization-management.controller";
import { PERSONAL_ORGANIZATION_PROVISIONER } from "./public/contracts";

@Module({
  imports: [OrganizationsModule, AccessControlModule],
  controllers: [OrganizationManagementController],
  providers: [
    CreateOrganizationUseCase,
    DeleteOrganizationUseCase,
    EnsurePersonalOrganizationUseCase,
    LeaveOrganizationUseCase,
    RemoveOrganizationMemberUseCase,
    UpdateMemberRoleUseCase,
    {
      provide: PERSONAL_ORGANIZATION_PROVISIONER,
      useExisting: EnsurePersonalOrganizationUseCase,
    },
  ],
  exports: [EnsurePersonalOrganizationUseCase, PERSONAL_ORGANIZATION_PROVISIONER],
})
export class OrganizationManagementModule {}
