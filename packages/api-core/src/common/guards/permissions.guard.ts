import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_CODES } from '../constants/error-codes';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppError } from '../errors/app-error';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Public routes bypass auth and permission checks by design.
    if (isPublic) {
      return true;
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    // Routes without a permission decorator are treated as authenticated-only.
    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Express.Request>();
    const user = request.user;

    // Missing user context means the auth guard did not populate the request.
    if (!user) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        'Authentication is required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const hasEveryPermission = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasEveryPermission) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You do not have permission to perform this action',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
