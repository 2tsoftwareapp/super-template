import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { RequestUser } from "./current-user.decorator";

import { AppError, ERROR_CODES } from "./errors";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { TokenService } from "./token.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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

    request.user = this.tokens.verify(header.slice("Bearer ".length));

    return true;
  }
}
