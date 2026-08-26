import type { ArgumentsHost } from "@nestjs/common";

import { HttpException, HttpStatus } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { AppError, ERROR_CODES } from "@repo/api-kernel";

import { AppExceptionFilter } from "../app-exception.filter";

function createHost() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const response = {
    locals: {} as Record<string, unknown>,
    status,
  };
  const request = {
    method: "POST",
    originalUrl: "/api/v1/users",
    requestId: "req-1",
    user: { userId: "user-1" },
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, json, request, response, status };
}

function createFilter(isProduction = false) {
  const logger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };
  const errorReporter = {
    reportException: vi.fn(),
    reportMessage: vi.fn(),
  };
  const filter = new AppExceptionFilter({ isProduction } as never, logger, errorReporter as never);

  return { errorReporter, filter, logger };
}

describe("AppExceptionFilter", () => {
  it("logs handled AppError warnings without reporting them", () => {
    const { filter, logger, errorReporter } = createFilter();
    const { host, json, response, status } = createHost();
    const exception = new AppError(ERROR_CODES.AUTH_FORBIDDEN, "Forbidden", HttpStatus.FORBIDDEN, {
      missing: "users.update",
    });

    filter.catch(exception, host);

    expect(response.locals.errorCode).toBe(ERROR_CODES.AUTH_FORBIDDEN);
    expect(logger.warn).toHaveBeenCalledWith(
      "Handled request exception",
      expect.objectContaining({
        details: { missing: "users.update" },
        errorCode: ERROR_CODES.AUTH_FORBIDDEN,
        method: "POST",
        path: "/api/v1/users",
        requestId: "req-1",
        statusCode: HttpStatus.FORBIDDEN,
        userId: "user-1",
      }),
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(errorReporter.reportException).not.toHaveBeenCalled();
    expect(errorReporter.reportMessage).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: ERROR_CODES.AUTH_FORBIDDEN,
        message: "Forbidden",
        details: { missing: "users.update" },
      },
      meta: { requestId: "req-1" },
    });
  });

  it("reports non-AppError server failures with stack in non-production", () => {
    const { filter, logger, errorReporter } = createFilter(false);
    const { host } = createHost();
    const exception = new Error("boom");

    filter.catch(exception, host);

    expect(logger.error).toHaveBeenCalledWith(
      "Unhandled request exception",
      expect.objectContaining({
        errorCode: ERROR_CODES.INTERNAL_ERROR,
        stack: exception.stack,
      }),
    );
    expect(errorReporter.reportException).toHaveBeenCalledWith(
      exception,
      expect.objectContaining({
        errorCode: ERROR_CODES.INTERNAL_ERROR,
        stack: exception.stack,
      }),
    );
  });

  it("maps bad-request HttpException arrays to validation failures", () => {
    const { filter, logger } = createFilter(true);
    const { host, json } = createHost();

    filter.catch(
      new HttpException({ message: ["email must be valid"] }, HttpStatus.BAD_REQUEST),
      host,
    );

    expect(logger.warn).toHaveBeenCalledWith(
      "Handled request exception",
      expect.objectContaining({
        details: ["email must be valid"],
        errorCode: ERROR_CODES.VALIDATION_FAILED,
      }),
    );
    expect(json).toHaveBeenCalledWith({
      error: {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: "Validation failed",
        details: ["email must be valid"],
      },
      meta: { requestId: "req-1" },
    });
  });
});
