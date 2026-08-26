import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import {
  ORGANIZATION_MEMBERSHIP,
  type OrganizationMembership,
  registerLazyPort,
  USER_ROLE_ASSIGNMENTS,
  type UserRoleAssignments,
} from "@repo/api-runtime";

/**
 * Registers users-owned cross-feature ports into the kernel lazy registry so
 * earlier-booting features (access-control, organizations) can resolve them
 * without Nest ModuleRef (fragile under duplicate @nestjs/core instances).
 */
@Injectable()
export class LazyPortRegistrarService implements OnModuleInit {
  constructor(
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly organizationMembership: OrganizationMembership,
    @Inject(USER_ROLE_ASSIGNMENTS)
    private readonly userRoleAssignments: UserRoleAssignments,
  ) {}

  onModuleInit(): void {
    registerLazyPort(ORGANIZATION_MEMBERSHIP, this.organizationMembership);
    registerLazyPort(USER_ROLE_ASSIGNMENTS, this.userRoleAssignments);
  }
}
