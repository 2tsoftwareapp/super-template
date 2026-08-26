export { ROLE_NAMES } from "../access-control.constants";
/** Public contracts for @repo/feature-access-control. */
export { AccessControlModule } from "../access-control.module";
export { AccessControlService } from "../application/access-control.service";
export { ACCESS_CONTROL_REPOSITORY } from "../application/ports/access-control.repository.port";
export type * from "../application/ports/access-control.repository.port";
export { RoleManagementUseCase } from "../application/use-cases/role-management.use-case";
export {
  assertCanAssignRoleTargets,
  assertRoleScopeCanBeAssigned,
  type RolePolicyTarget,
} from "../domain/role-assignment.policy";
