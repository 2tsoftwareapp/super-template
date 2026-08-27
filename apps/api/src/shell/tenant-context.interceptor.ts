import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "@repo/api-runtime";
import { TenantContextService } from "@repo/api-runtime";
import { Observable } from "rxjs";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
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

    if (!user) {
      return next.handle();
    }

    const isSuperAdmin = user.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    if (!user.organizationId && !isSuperAdmin) {
      return next.handle();
    }

    const tenantId = user.organizationId ?? "";
    const bypassRls = isSuperAdmin;

    return new Observable((subscriber) => {
      this.tenantContextService.run(
        {
          tenantId,
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
