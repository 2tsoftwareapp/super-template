import type { ApiErrorEnvelope } from "./api-types";

import { getCsrfTokenFromDocument } from "./utils";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: ApiErrorEnvelope | null,
  ) {
    super(payload?.error.message ?? `Request failed with status ${status}`);
  }
}

export async function webFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const method = init.method?.toUpperCase() ?? "GET";

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
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
