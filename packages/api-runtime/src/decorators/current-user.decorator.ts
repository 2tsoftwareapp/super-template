import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRequestUser | undefined =>
    context.switchToHttp().getRequest<Express.Request>().user,
);
