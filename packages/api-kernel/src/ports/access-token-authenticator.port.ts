import type { AuthenticatedRequestUser } from "../types/request-context";

/**
 * DI token for {@link AccessTokenAuthenticator}.
 *
 * The app-shell auth guard lives in the kernel-facing shell and must not depend
 * on the identity feature package directly. It resolves a bearer token into the
 * authenticated request user through this port; the identity feature binds the
 * concrete implementation. Removing the identity feature removes the binding
 * (the guard then has no authenticator and every non-public route is rejected).
 */
export const ACCESS_TOKEN_AUTHENTICATOR = Symbol("ACCESS_TOKEN_AUTHENTICATOR");

export interface AccessTokenAuthenticator {
  /**
   * Validate an access token and resolve it into the authenticated request user.
   * Implementations throw an {@link AppError} with an auth error code when the
   * token is missing, expired, or otherwise invalid.
   */
  authenticateAccessToken(token: string): Promise<AuthenticatedRequestUser>;
}
