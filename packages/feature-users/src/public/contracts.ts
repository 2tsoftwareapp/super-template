/** Public contracts for @repo/feature-users.
 * Nest UsersModule is exported from `@repo/feature-users/module` to avoid
 * circular evaluate with feature-auth.
 */
export { USERS_REPOSITORY } from "../application/ports/users.repository.port";
export type * from "../application/ports/users.repository.port";
export { USER_ERROR_CODES } from "./error-codes";
export * from "./file-lookup.port";
export * from "./user-lookup.port";

// Consumer-owned ports and tokens. Defined here (the implementer) so
// dependent features can consume them without importing the concrete
// services.
export type { UserAccessControl } from "./user-access-control.port";
export { USER_ACCESS_CONTROL } from "./user-access-control.token";
export type { UserProfileInvalidator } from "./user-profile-invalidator.port";
export { USER_PROFILE_INVALIDATOR } from "./user-profile-invalidator.token";
export type { PersonalOrganizationProvider } from "./personal-organization-provider.port";
export { PERSONAL_ORGANIZATION_PROVIDER } from "./personal-organization-provider.token";
export type {
  UserRoleAssignment,
  UserRoleAssignments,
} from "./user-role-assignments.port";
export { USER_ROLE_ASSIGNMENTS } from "./user-role-assignments.token";
export type {
  OrganizationMemberRecord,
  OrganizationMemberWithUserRecord,
  OrganizationMembership,
  OrganizationMemberRole,
  UserOrganizationRecord,
} from "./organization-membership.port";
export { ORGANIZATION_MEMBERSHIP } from "./organization-membership.token";

// System role-name constants and role-assignment policy. Duplicated from
// feature-access-control to break the users <-> access-control dependsOn
// cycle.
export { ROLE_NAMES, type RoleName, isPrivilegedRoleName } from "./role.constants";
export {
  assertCanAssignRoleTargets,
  assertRoleScopeCanBeAssigned,
  type RolePolicyTarget,
} from "../domain/role-assignment.policy";
