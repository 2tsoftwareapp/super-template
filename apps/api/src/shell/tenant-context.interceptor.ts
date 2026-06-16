import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@repo/api-core';
import { TenantContextService } from '@repo/api-database';
import { ROLE_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';
import { Observable } from 'rxjs';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContextService: TenantContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Express.Request>();
    const user = request.user;

    if (!user?.organizationId) {
      return next.handle();
    }

    const bypassRls = user.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    return new Observable((subscriber) => {
      this.tenantContextService.run(
        {
          tenantId: user.organizationId as string,
          userId: user.userId,
          bypassRls,
        },
        () => {
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (error) => subscriber.error(error),
            complete: () => subscriber.complete(),
          });
        },
      );
    });
  }
}
