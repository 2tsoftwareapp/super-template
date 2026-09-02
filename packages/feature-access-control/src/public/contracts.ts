/** Public contracts for @repo/feature-access-control. */

// Cross-feature integration surfaces: stable use-case and service
// that auth/sso/user-management depend on for role management.
export { AccessControlService } from "../application/access-control.service";
export type * from "../application/ports/access-control.repository.port";
export { RoleManagementUseCase } from "../application/use-cases/role-management.use-case";
export {
  assertCanAssignRoleTargets,
  assertCanManagePrivilegedAccount,
  assertRoleScopeCanBeAssigned,
  type RolePolicyTarget,
} from "../domain/role-assignment.policy";
export { ACCESS_CONTROL_REPOSITORY } from "./access-control-repository.token";
export { ACCESS_CONTROL_ERROR_CODES } from "./error-codes";
export {
  FIXED_ROLE_NAMES,
  isFixedRoleName,
  isPrivilegedRoleName,
  PRIVILEGED_ROLE_NAMES,
  type PrivilegedRoleName,
  ROLE_NAMES,
  type RoleName,
} from "./role.constants";
export type { UserAccessControl } from "./user-access-control.port";
export { USER_ACCESS_CONTROL } from "./user-access-control.token";
export type { UserProfileInvalidator } from "./user-profile-invalidator.port";
export { USER_PROFILE_INVALIDATOR } from "./user-profile-invalidator.token";
export type { UserRoleAssignment, UserRoleAssignments } from "./user-role-assignments.port";
export { USER_ROLE_ASSIGNMENTS } from "./user-role-assignments.token";
