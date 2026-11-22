import type { NextFunction, Request, Response } from "express";

import { randomUUID } from "node:crypto";

import { Logger } from "@nestjs/common";

const REQUEST_ID_HEADER = "x-request-id";
const SAFE_REQUEST_ID = /^[\w-]{1,128}$/;
const logger = new Logger("HTTP");

/** Reuses a well-formed incoming id (from a proxy or the admin BFF) or mints one. */
export function resolveRequestId(incoming: string | undefined): string {
  return incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
}

/** One line per request: method, path (no query string), status, duration and request id. */
export function requestLog(request: Request, response: Response, next: NextFunction): void {
  const requestId = resolveRequestId(request.header(REQUEST_ID_HEADER));
  const startedAt = process.hrtime.bigint();

  response.setHeader(REQUEST_ID_HEADER, requestId);
  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    logger.log(
      `${request.method} ${request.path} ${response.statusCode} ${durationMs.toFixed(1)}ms id=${requestId}`,
    );
  });

  next();
}
