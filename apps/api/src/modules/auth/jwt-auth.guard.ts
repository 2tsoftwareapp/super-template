import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { RequestUser } from "../../shared/current-user.decorator";

import { AppError, ERROR_CODES } from "../../shared/errors";
import { IS_PUBLIC_KEY } from "../../shared/public.decorator";
import { AuthRepository } from "./auth.repository";
import { TokenService } from "./token.service";

/**
 * A valid signature is not enough: the user is re-read on every request so a
 * blocked, deleted or demoted account loses access immediately, not at expiry.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(AuthRepository) private readonly users: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Authentication required", 401);
    }

    const { userId, issuedAt } = this.tokens.verify(header.slice("Bearer ".length));
    const user = await this.users.findById(userId);

    if (!user || user.status !== "ACTIVE") {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Account is not active", 401);
    }

    if (user.tokensValidAfter && issuedAt < user.tokensValidAfter.getTime()) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Session has been revoked", 401);
    }

    request.user = { userId: user.id, role: user.role };

    return true;
  }
}
