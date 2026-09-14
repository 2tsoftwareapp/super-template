/** Public contracts for @repo/feature-users.
 * Nest UsersModule is exported from `@repo/feature-users/module` to avoid
 * circular evaluate with feature-auth.
 */
export { USERS_REPOSITORY } from "../application/ports/users.repository.port";
export type * from "../application/ports/users.repository.port";
export { userSortsFromQuery } from "../application/user-sort";
export type * from "../application/users.types";
export { USER_ERROR_CODES } from "./error-codes";
export * from "./user-lookup.port";
export * from "./user-organization-scope.port";
