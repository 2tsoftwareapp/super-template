import { Injectable } from "@nestjs/common";

import { AuthenticateAccessTokenUseCase } from "./use-cases/authenticate-access-token.use-case";

/**
 * Cross-module facade exposing the single auth operation the app-shell auth
 * guard needs: resolving an access token into the authenticated request user.
 * All auth HTTP endpoints inject the auth use cases directly instead of this
 * facade.
 */
@Injectable()
export class AuthService {
  constructor(private readonly authenticateAccessTokenUseCase: AuthenticateAccessTokenUseCase) {}

  authenticateAccessToken(token: string) {
    return this.authenticateAccessTokenUseCase.execute(token);
  }
}
