import type { Response as ExpressResponse, Request } from "express";

import { randomUUID } from "node:crypto";

import {
  clearAuthCookies,
  isValidCsrfToken,
  readAuthCookies,
  setAuthCookies,
} from "./cookies";
import { env } from "./env";

const backendUrl = (pathWithQuery: string) =>
  new URL(`/api/v1/${pathWithQuery.replace(/^\/+/, "")}`, env.API_INTERNAL_URL);

const isBackendConnectionError = (error: unknown): boolean => {
  if (!(error instanceof TypeError) || error.message !== "fetch failed") {
    return false;
  }

  const cause = (error as TypeError & { cause?: { code?: string } }).cause;
  return (
    cause?.code === "ECONNREFUSED" ||
    cause?.code === "ENOTFOUND" ||
    cause?.code === "ECONNRESET"
  );
};

const backendUnavailableResponse = () =>
  new Response(
    JSON.stringify({
      error: {
        code: "BACKEND_UNAVAILABLE",
        message:
          "API server is not reachable. Start it with `make dev-api` or `make dev`.",
        details: null,
      },
      meta: {
        requestId: randomUUID(),
      },
    }),
    {
      status: 503,
      headers: {
        "content-type": "application/json",
      },
    },
  );

const forwardableHeaderNames = ["accept", "content-type", "user-agent"];

const pickHeaders = (req: Request) => {
  const headers = new Headers();

  for (const name of forwardableHeaderNames) {
    const value = req.headers[name];
    if (typeof value === "string") {
      headers.set(name, value);
    }
  }

  return headers;
};

const parseJson = async <T>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as T;
};

interface ProxyOptions {
  accessToken?: string | null;
  body?: Buffer | string | null | undefined;
  headers?: Headers;
  method: string;
  path: string;
}

export const callBackend = async ({
  accessToken,
  body,
  headers = new Headers(),
  method,
  path,
}: ProxyOptions): Promise<Response> => {
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (body !== undefined) {
    init.body = body;
  }

  try {
    return await fetch(backendUrl(path), init);
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return backendUnavailableResponse();
    }

    throw error;
  }
};

interface RefreshSessionPayload {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export const refreshSession = async (
  refreshToken: string,
): Promise<RefreshSessionPayload | null> => {
  let response: Response;

  try {
    response = await fetch(backendUrl("auth/refresh"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch (error) {
    if (isBackendConnectionError(error)) {
      return null;
    }

    throw error;
  }

  const payload = await parseJson<RefreshSessionPayload>(response);

  if (
    !response.ok ||
    !payload?.data?.accessToken ||
    !payload?.data?.refreshToken
  ) {
    return null;
  }

  return payload;
};

export const enforceCsrf = (req: Request) => {
  const { accessToken, refreshToken, csrfToken } = readAuthCookies(req);

  if (!accessToken && !refreshToken) {
    return null;
  }

  const origin = req.headers.origin;
  const requestCsrfToken = req.headers["x-csrf-token"];

  if (
    origin !== env.ADMIN_ORIGIN ||
    !csrfToken ||
    requestCsrfToken !== csrfToken ||
    !isValidCsrfToken(csrfToken)
  ) {
    return {
      code: "AUTH_FORBIDDEN",
      message: "CSRF validation failed",
    };
  }

  return null;
};

export const sendForbidden = (res: ExpressResponse, error: { code: string; message: string }) => {
  res.status(403).json({
    error: { ...error, details: null },
    meta: { requestId: randomUUID() },
  });
};

export const proxyWithRefresh = async (
  req: Request,
  res: ExpressResponse,
  pathWithQuery: string,
) => {
  const method = req.method.toUpperCase();
  const isGetOrHead = method === "GET" || method === "HEAD";
  const body = !isGetOrHead && Buffer.isBuffer(req.body) ? req.body : undefined;
  const { accessToken, refreshToken, csrfToken } = readAuthCookies(req);
  const headers = pickHeaders(req);
  const bareePath = pathWithQuery.split("?")[0] ?? "";

  let response = await callBackend({
    path: pathWithQuery,
    method,
    headers,
    body,
    accessToken,
  });

  let refreshedTokens: { accessToken: string; refreshToken: string } | null =
    null;

  if (response.status === 401 && refreshToken && !bareePath.startsWith("auth/")) {
    const refreshed = await refreshSession(refreshToken);

    if (refreshed) {
      refreshedTokens = refreshed.data;
      response = await callBackend({
        path: pathWithQuery,
        method,
        headers: pickHeaders(req),
        body,
        accessToken: refreshed.data.accessToken,
      });
    }
  }

  const payload = await parseJson(response);

  if (refreshedTokens) {
    setAuthCookies(res, refreshedTokens, csrfToken ?? undefined);
  } else if (response.status === 401) {
    clearAuthCookies(res);
  }

  res.status(response.status).json(payload);
};
