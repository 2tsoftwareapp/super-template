import type { ApiErrorEnvelope } from "./api-types";

import { ApiClientError } from "./http";

/**
 * Error taxonomy shared by every client app. The kind — not the raw status —
 * is what UI code branches on, so a BFF status change never ripples into
 * components. See CODING_RULES.md §18.
 */
export type ErrorKind =
  | "network"
  | "auth"
  | "permission"
  | "not-found"
  | "validation"
  | "conflict"
  | "rate-limit"
  | "server"
  | "unknown";

/** Where an error should surface. See CODING_RULES.md §18.1. */
export type ErrorScope = "global" | "local" | "inline";

export interface ClassifiedError {
  kind: ErrorKind;
  /** HTTP status when the error came from the BFF, else null. */
  status: number | null;
  /** Safe, user-facing message. Never contains a stack trace. */
  message: string;
  /** Per-field messages when the BFF returned a validation envelope. */
  fieldErrors: Record<string, string>;
  /** True when retrying the same request could plausibly succeed. */
  retryable: boolean;
  /** Recommended surface for this error. */
  scope: ErrorScope;
}

const KIND_BY_STATUS: Record<number, ErrorKind> = {
  400: "validation",
  401: "auth",
  403: "permission",
  404: "not-found",
  409: "conflict",
  422: "validation",
  429: "rate-limit",
};

const DEFAULT_MESSAGE: Record<ErrorKind, string> = {
  network: "Cannot reach the server. Check your connection and try again.",
  auth: "Your session has expired. Sign in again to continue.",
  permission: "You do not have permission to perform this action.",
  "not-found": "The requested item no longer exists.",
  validation: "Some of the submitted values are invalid.",
  conflict: "This item was changed elsewhere. Reload and try again.",
  "rate-limit": "Too many requests. Wait a moment and try again.",
  server: "Something went wrong on our side. Please try again.",
  unknown: "Something went wrong. Please try again.",
};

/** Errors worth a retry button; the rest need a different user action. */
const RETRYABLE: ReadonlySet<ErrorKind> = new Set<ErrorKind>([
  "network",
  "rate-limit",
  "server",
  "conflict",
]);

/**
 * Auth and permission failures replace the whole screen; validation and
 * conflicts belong next to the control that caused them; everything else
 * degrades the section it was rendered in.
 */
const SCOPE: Record<ErrorKind, ErrorScope> = {
  network: "local",
  auth: "global",
  permission: "global",
  "not-found": "local",
  validation: "inline",
  conflict: "inline",
  "rate-limit": "inline",
  server: "local",
  unknown: "local",
};

function extractFieldErrors(payload: ApiErrorEnvelope | null): Record<string, string> {
  const details = payload?.error?.details;
  if (!details || typeof details !== "object") {
    return {};
  }

  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of Object.entries(details as Record<string, unknown>)) {
    if (typeof value === "string") {
      fieldErrors[field] = value;
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      fieldErrors[field] = value[0];
    }
  }
  return fieldErrors;
}

function isNetworkError(error: unknown): boolean {
  // fetch() rejects with a bare TypeError when the request never reached the
  // server (DNS failure, offline, CORS preflight refused).
  return error instanceof TypeError && /fetch|network/i.test(error.message);
}

/**
 * Turn any thrown value into a shape UI code can branch on. Never throws —
 * an unrecognised value degrades to `unknown`.
 */
export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof ApiClientError) {
    const kind =
      KIND_BY_STATUS[error.status] ?? (error.status >= 500 ? "server" : "unknown");

    return {
      kind,
      status: error.status,
      // Prefer the BFF message; it is already localised and user-safe.
      message: error.payload?.error?.message ?? DEFAULT_MESSAGE[kind],
      fieldErrors: extractFieldErrors(error.payload),
      retryable: RETRYABLE.has(kind),
      scope: SCOPE[kind],
    };
  }

  const kind: ErrorKind = isNetworkError(error) ? "network" : "unknown";

  return {
    kind,
    status: null,
    message: DEFAULT_MESSAGE[kind],
    fieldErrors: {},
    retryable: RETRYABLE.has(kind),
    scope: SCOPE[kind],
  };
}

/**
 * User-facing message with a caller-supplied fallback. Use this instead of
 * reading `error.message` directly — raw messages can leak internals.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const classified = classifyError(error);
  if (classified.kind === "unknown" && fallback) {
    return fallback;
  }
  return classified.message;
}

export function isRetryableError(error: unknown): boolean {
  return classifyError(error).retryable;
}

/**
 * React Query `retry` predicate. Client errors are never retried — only
 * transient transport and server failures, up to `max` attempts.
 */
export function shouldRetryQuery(failureCount: number, error: unknown, max = 2): boolean {
  return failureCount < max && isRetryableError(error);
}
