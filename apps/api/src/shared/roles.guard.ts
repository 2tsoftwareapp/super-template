import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { RequestUser } from "./current-user.decorator";

import { AppError, ERROR_CODES } from "./errors";
import { ROLES_KEY, type Role } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest<Request & { user?: RequestUser }>().user;

    if (!user || !required.includes(user.role as Role)) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Insufficient role", 403);
    }

    return true;
  }
}
