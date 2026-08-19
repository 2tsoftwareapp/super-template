import type { ApiErrorEnvelope } from "./api-types";

import { getCsrfBootstrapPath, getCsrfCookieName } from "./http-config";
import { getCsrfTokenFromDocument } from "./utils";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: ApiErrorEnvelope | null,
  ) {
    super(payload?.error.message ?? `Request failed with status ${status}`);
  }
}

let csrfFetchPromise: Promise<void> | null = null;

async function ensureCsrfToken(): Promise<void> {
  if (typeof document === "undefined") {
    return;
  }

  if (getCsrfTokenFromDocument()) {
    return;
  }

  if (!csrfFetchPromise) {
    const url = `${window.location.origin}${getCsrfBootstrapPath()}`;
    csrfFetchPromise = fetch(url, { credentials: "same-origin" })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        csrfFetchPromise = null;
      });
  }

  await csrfFetchPromise;
}

async function requestSameOrigin(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const method = init.method?.toUpperCase() ?? "GET";

  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await ensureCsrfToken();
    const csrfToken = getCsrfTokenFromDocument();
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  return fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  let payload: ApiErrorEnvelope | null = null;

  try {
    payload = (await response.json()) as ApiErrorEnvelope;
  } catch {
    payload = null;
  }

  throw new ApiClientError(response.status, payload);
}

/** JSON BFF/API calls — CSRF + same-origin credentials. */
export async function webFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await requestSameOrigin(path, init);
  await throwIfNotOk(response);
  return (await response.json()) as T;
}

/**
 * Binary downloads (CSV, files) through the same CSRF/credentials path as
 * `webFetch`. Prefer this over raw `fetch` for BFF downloads.
 * Trace: CODING_RULES §20 R3.
 */
export async function webFetchBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const response = await requestSameOrigin(path, init);
  await throwIfNotOk(response);
  return response.blob();
}

// Re-export for tests and callers that need the configured cookie name.
export { getCsrfCookieName };
