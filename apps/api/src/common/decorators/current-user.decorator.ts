import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequestUser } from '../types/request-context';

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedRequestUser | undefined =>
    context.switchToHttp().getRequest<Express.Request>().user,
);
