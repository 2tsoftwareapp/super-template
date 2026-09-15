import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppError, PLATFORM_ROLE_NAMES } from "@repo/api-kernel";

import { AUTHORIZE_KEY, type AuthorizeOptions } from "../decorators/authorize.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ERROR_CODES } from "../error-codes";

/** Platform super-role; role ownership lives in feature-access-control. */
const SUPER_ADMIN_ROLE = PLATFORM_ROLE_NAMES.SUPER_ADMIN;

@Injectable()
export class AuthorizeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const authorize = this.reflector.getAllAndOverride<AuthorizeOptions>(AUTHORIZE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRoles = authorize?.roles ?? [];
    const requiredPermissions = authorize?.permissions ?? [];

    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Express.Request>();
    const user = request.user;

    if (!user) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        "Authentication is required",
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.roles.includes(SUPER_ADMIN_ROLE)) {
      return true;
    }

    const hasRequiredRole =
      requiredRoles.length === 0 || requiredRoles.some((role) => user.roles.includes(role));

    const hasRequiredPermissions =
      requiredPermissions.length === 0 ||
      requiredPermissions.every((permission) => user.permissions.includes(permission));

    if (!hasRequiredRole || !hasRequiredPermissions) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "You do not have the required role or permission to perform this action",
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
