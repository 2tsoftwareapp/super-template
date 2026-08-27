export * from "../application/auth.helpers";
export { AuthService } from "../application/auth.service";
export { AUTH_SESSION_REPOSITORY } from "../application/ports/auth-session.repository.port";
export type * from "../application/ports/auth-session.repository.port";
export { AUTH_TOKEN_PROVIDER } from "../application/ports/auth-token.provider.port";
export type * from "../application/ports/auth-token.provider.port";
export { IssueSessionUseCase } from "../application/use-cases/issue-session.use-case";
/** Public contracts for @repo/feature-auth.
 * Intentionally does NOT export AuthModule — importing AuthModule here creates a
 * circular evaluate with feature-users (UsersModule ↔ AuthModule). Consumers that
 * need the Nest module should import `@repo/feature-auth/module`.
 */
export { AuthDataModule } from "../auth-data.module";
export * from "./access-token-authenticator.port";
export * from "./auth-user-store.port";
export {
  AUTH_TOKEN_MAINTENANCE,
  type AuthTokenMaintenance,
} from "./auth-token-maintenance.port";
export { AUTH_ERROR_CODES } from "./error-codes";
