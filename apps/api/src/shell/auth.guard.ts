import type { Request as ExpressRequest } from 'express';

import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError, ERROR_CODES, IS_PUBLIC_KEY } from '@repo/api-core';
import { AuthService } from '@repo/api-identity/modules/auth/application/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        'Authentication is required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authorization.slice('Bearer '.length);
    request.user = await this.authService.authenticateAccessToken(token);
    return true;
  }
}
