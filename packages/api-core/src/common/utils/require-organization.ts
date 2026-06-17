import { HttpStatus } from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../types/request-context';

import { ERROR_CODES } from '../constants/error-codes';
import { AppError } from '../errors/app-error';

export const requireOrganizationId = (
  user: Pick<AuthenticatedRequestUser, 'organizationId'>,
): string => {
  if (!user.organizationId) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'An active organization is required',
      HttpStatus.FORBIDDEN,
    );
  }

  return user.organizationId;
};
