export * from "./access-control.constants";
export { AccessControlModule } from "./access-control.module";
export { ACCESS_CONTROL_REPOSITORY } from "./application/access-control.repository.port";
export type * from "./application/access-control.repository.port";
export { AccessControlService } from "./application/access-control.service";
export type { AccessProfileView, RoleView as RoleDto } from "./application/access-control.types";
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