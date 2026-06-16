import { getCsrfTokenFromDocument } from "./utils";
import {
  clearStoredAuthTokens,
  getStoredAuthTokens,
  setStoredAuthTokens,
} from "./auth";

interface AuthEnvelope<T> {
  data: T;
  meta?: unknown;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    requestId?: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export async function webFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await request(path, init);
  if (!response.ok) {
    if (response.status === 401 && shouldAttemptRefresh(path)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retryResponse = await request(path, init);
        if (retryResponse.ok) {
          return (await retryResponse.json()) as T;
        }
        throw new Error(`Request failed with status ${retryResponse.status}`);
      }

      clearStoredAuthTokens();
    }

    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function request(path: string, init: RequestInit) {
  const headers = new Headers(init.headers);
  const method = init.method?.toUpperCase() ?? "GET";
  const storedAuth = getStoredAuthTokens();

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (storedAuth?.accessToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${storedAuth.accessToken}`);
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
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

function shouldAttemptRefresh(path: string) {
  return !path.includes("/api/v1/auth/login") && !path.includes("/api/v1/auth/refresh");
}

async function refreshAccessToken() {
  const storedAuth = getStoredAuthTokens();
  if (!storedAuth?.refreshToken) {
    return false;
  }

  const response = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${storedAuth.accessToken}`,
    },
    body: JSON.stringify({ refreshToken: storedAuth.refreshToken }),
    credentials: "same-origin",
  });

  if (!response.ok) {
    clearStoredAuthTokens();
    return false;
  }

  const payload = (await response.json()) as AuthEnvelope<{
    accessToken: string;
    refreshToken: string;
  }>;

  if (!payload.data?.accessToken || !payload.data?.refreshToken) {
    clearStoredAuthTokens();
    return false;
  }

  setStoredAuthTokens({
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
  });

  return true;
}
