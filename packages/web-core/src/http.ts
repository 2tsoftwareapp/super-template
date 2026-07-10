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

export async function webFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
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

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (!response.ok) {
    let payload: ApiErrorEnvelope | null = null;

    try {
      payload = (await response.json()) as ApiErrorEnvelope;
    } catch {
      payload = null;
    }

    throw new ApiClientError(response.status, payload);
  }

  return (await response.json()) as T;
}

// Re-export for tests and callers that need the configured cookie name.
export { getCsrfCookieName };
