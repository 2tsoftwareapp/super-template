import type { TransactionExecutor } from "@repo/api-kernel";

/** Public contracts for @repo/feature-access-control. */
export { AccessControlModule } from "../access-control.module";
export { AccessControlService } from "../application/access-control.service";
export {
  ACCESS_CONTROL_REPOSITORY,
} from "./access-control-repository.token";
export type * from "../application/ports/access-control.repository.port";
export { RoleManagementUseCase } from "../application/use-cases/role-management.use-case";
export {
  assertCanAssignRoleTargets,
  assertRoleScopeCanBeAssigned,
  type RolePolicyTarget,
} from "../domain/role-assignment.policy";

export { USER_ROLE_ASSIGNMENTS } from "./user-role-assignments.token";

/**
 * Consumer-owned port: role assignment persistence lives in feature-users
 * storage, but access-control defines the contract it needs. Bound by the
 * users integration providers.
 */
export interface UserRoleAssignment {
  roleName: string;
  roleId: string;
  organizationId: string | null;
}

export interface UserRoleAssignments {
  findUserIdsForRole(roleId: string, executor?: TransactionExecutor): Promise<string[]>;

  findUserIdsForRoleName(
    roleName: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  findUserIdsForPermission(permissionId: string, executor?: TransactionExecutor): Promise<string[]>;

  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<void>;

  findRoleNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  findPermissionNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  findRoleNamesForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<{ userId: string; roleName: string }[]>;

  findRoleIdsForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  findRoleAssignmentsForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<UserRoleAssignment[]>;

  findRoleIdsForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<{ userId: string; roleId: string }[]>;

  assignUserRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<void>;

  deleteByOrganizationId(organizationId: string, executor?: TransactionExecutor): Promise<void>;
}

export { ACCESS_CONTROL_ERROR_CODES } from "./error-codes";
export { ROLE_NAMES, type RoleName } from "./role.constants";
