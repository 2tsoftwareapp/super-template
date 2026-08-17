import { HttpStatus } from "@nestjs/common";

import type { ErrorCode } from "../constants/error-codes";

// AppError is the canonical typed failure for domain and application-layer rules.
// The global exception filter turns it into a stable JSON contract for clients.
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
