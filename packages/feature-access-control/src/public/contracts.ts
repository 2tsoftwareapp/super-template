/** Public contracts for @repo/feature-access-control. */
export { AccessControlModule } from "../access-control.module";
export { AccessControlService } from "../application/access-control.service";
export type * from "../application/ports/access-control.repository.port";
export { RoleManagementUseCase } from "../application/use-cases/role-management.use-case";
export {
  assertCanAssignRoleTargets,
  assertRoleScopeCanBeAssigned,
  type RolePolicyTarget,
} from "../domain/role-assignment.policy";
export { ACCESS_CONTROL_REPOSITORY } from "./access-control-repository.token";

export { ACCESS_CONTROL_ERROR_CODES } from "./error-codes";

export { ROLE_NAMES, type RoleName } from "./role.constants";
/**
 * The user-role-assignments port is owned by @repo/feature-users (the
 * implementer). Re-exported here so existing access-control and consumer
 * code that imports it from feature-access-control/contracts keeps
 * working.
 */
export type { UserRoleAssignment, UserRoleAssignments } from "@repo/feature-users/contracts";

export { USER_ROLE_ASSIGNMENTS } from "@repo/feature-users/contracts";
