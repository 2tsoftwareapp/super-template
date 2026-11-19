import type { ExecutionContext } from "@nestjs/common";

import { createParamDecorator } from "@nestjs/common";

export interface RequestUser {
  userId: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser =>
    context.switchToHttp().getRequest<{ user: RequestUser }>().user,
);
