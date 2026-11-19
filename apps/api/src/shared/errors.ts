import { HttpStatus } from "@nestjs/common";

export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_TOKEN_REUSED: "AUTH_TOKEN_REUSED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_EMAIL_TAKEN: "USER_EMAIL_TAKEN",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_TYPE_NOT_ALLOWED: "FILE_TYPE_NOT_ALLOWED",
  JOB_NOT_FOUND: "JOB_NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = HttpStatus.BAD_REQUEST,
  ) {
    super(message);
    this.name = "AppError";
  }
}
