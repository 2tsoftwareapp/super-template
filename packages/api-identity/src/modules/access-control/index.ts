export * from "./access-control.constants";
export { AccessControlModule } from "./access-control.module";
export { AccessControlService } from "./application/access-control.service";
export type { AccessProfileView, RoleView as RoleDto } from "./application/access-control.types";
export { ACCESS_CONTROL_REPOSITORY } from "./application/ports/access-control.repository.port";
export type * from "./application/ports/access-control.repository.port";
export {
  assertCanAssignRoles,
  assertCanAssignRoleTargets,
  assertCanCreateCustomRole,
  assertCanManageCustomRoleCatalog,
  assertCanManagePrivilegedAccount,
  assertCanModifyCustomRole,
  assertRoleScopeCanBeAssigned,
  type RolePolicyTarget,
} from "./domain/role-assignment.policy";
