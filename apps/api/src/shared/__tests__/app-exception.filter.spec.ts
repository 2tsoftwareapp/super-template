import type { ArgumentsHost } from "@nestjs/common";

import {
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { describe, expect, it, vi } from "vitest";

import { AppExceptionFilter } from "../app-exception.filter";
import { AppError, ERROR_CODES } from "../errors";

function respond(exception: unknown): { status: number; body: unknown } {
  const captured = { status: 0, body: undefined as unknown };
  const response = {
    status(code: number) {
      captured.status = code;
      return response;
    },
    json(body: unknown) {
      captured.body = body;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  new AppExceptionFilter().catch(exception, host);

  return captured;
}

describe("AppExceptionFilter", () => {
  vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

  it("passes an AppError through unchanged", () => {
    expect(respond(new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404))).toEqual({
      status: 404,
      body: { error: { code: "USER_NOT_FOUND", message: "User not found" } },
    });
  });

  it("hides the framework message of an unknown route", () => {
    expect(respond(new NotFoundException("Cannot GET /api/v1/nope"))).toEqual({
      status: 404,
      body: { error: { code: "ROUTE_NOT_FOUND", message: "Route not found" } },
    });
  });

  it.each([
    [new PayloadTooLargeException("File too large"), 413, "FILE_TOO_LARGE"],
    [new ThrottlerException(), 429, "RATE_LIMITED"],
    [new HttpException("gone", HttpStatus.GONE), 410, "REQUEST_REJECTED"],
  ])("maps framework status %#", (exception, status, code) => {
    expect(respond(exception)).toMatchObject({ status, body: { error: { code } } });
  });

  it("never leaks the message of an unexpected or 5xx error", () => {
    for (const exception of [new Error("db password wrong"), new HttpException("upstream", 503)]) {
      expect(respond(exception)).toEqual({
        status: 500,
        body: { error: { code: "INTERNAL_ERROR", message: "Unexpected error" } },
      });
    }
  });
});
