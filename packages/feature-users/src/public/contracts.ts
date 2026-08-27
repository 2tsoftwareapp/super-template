/** Public contracts for @repo/feature-users.
 * Nest UsersModule is exported from `@repo/feature-users/module` to avoid
 * circular evaluate with feature-auth.
 */
export { USERS_REPOSITORY } from "../application/ports/users.repository.port";
export type * from "../application/ports/users.repository.port";
export { GetUserUseCase } from "../application/use-cases/get-user.use-case";
export { UsersMapper } from "../application/users.mapper";
export { UserDto } from "../presentation/users.dto";
export * from "./user-lookup.port";
export * from "./file-lookup.port";
export { USER_ERROR_CODES } from "./error-codes";
