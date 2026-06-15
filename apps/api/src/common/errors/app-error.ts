import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '../constants/error-codes';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode = HttpStatus.BAD_REQUEST,
    public readonly details: unknown = null,
  ) {
    super(message);
  }
}
