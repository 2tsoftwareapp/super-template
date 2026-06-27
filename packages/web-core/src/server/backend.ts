import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { ApiEnvelope } from "../api-types";
import type { AuthCookieHelpers } from "../auth/cookies";
import type { JsonValue } from "../json";

const forwardableHeaderNames = ["accept", "content-type", "user-agent"];

const parseJson = async <T>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as T;
};

const isBackendConnectionError = (error: Error): boolean => {
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
        requestId: crypto.randomUUID(),
      },
    }),
    {
      status: 503,
      headers: {
        "content-type": "application/json",
      },
    },
  );

const pickHeaders = (request: NextRequest) => {
  const headers = new Headers();

  for (const name of forwardableHeaderNames) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  return headers;
};

export interface RefreshSessionPayload {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface CreateBackendHelpersOptions {
  apiInternalUrl: string;
  allowedOrigins: string[];
  auth: AuthCookieHelpers;
}

export function createBackendHelpers({
  apiInternalUrl,
  allowedOrigins,
  auth,
}: CreateBackendHelpersOptions) {
  const backendUrl = (path: string) =>
    new URL(`/api/v1/${path.replace(/^\/+/, "")}`, apiInternalUrl);

  const callBackend = async ({
    accessToken,
    body,
    headers = new Headers(),
    method,
    path,
  }: {
    accessToken?: string | null;
    body?: BodyInit | null;
    headers?: Headers;
    method: string;
    path: string;
  }): Promise<Response> => {
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
      if (error instanceof Error && isBackendConnectionError(error)) {
        return backendUnavailableResponse();
      }

      throw error;
    }
  };

  const refreshSession = async (
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
      if (error instanceof Error && isBackendConnectionError(error)) {
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

  const enforceCsrf = async (request: NextRequest) => {
    const { accessToken, refreshToken, csrfToken } = await auth.readAuthCookies();

    if (!accessToken && !refreshToken) {
      return null;
    }

    const origin = request.headers.get("origin");
    const requestCsrfToken = request.headers.get("x-csrf-token");

    if (
      !origin ||
      !allowedOrigins.includes(origin) ||
      !csrfToken ||
      requestCsrfToken !== csrfToken ||
      !auth.isValidCsrfToken(csrfToken)
    ) {
      return NextResponse.json(
        {
          error: {
            code: "AUTH_FORBIDDEN",
            message: "CSRF validation failed",
            details: null,
          },
          meta: {
            requestId: crypto.randomUUID(),
          },
        },
        { status: 403 },
      );
    }

    return null;
  };

  const proxyWithRefresh = async (request: NextRequest, path: string) => {
    const method = request.method.toUpperCase();
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");
    const body =
      method === "GET" || method === "HEAD"
        ? null
        : isMultipart
          ? await request.arrayBuffer()
          : await request.text();
    const { accessToken, refreshToken, csrfToken } = await auth.readAuthCookies();
    const headers = pickHeaders(request);

    let response = await callBackend({
      path,
      method,
      headers,
      body,
      accessToken,
    });

    let refreshedTokens: {
      accessToken: string;
      refreshToken: string;
    } | null = null;

    if (
      response.status === 401 &&
      refreshToken &&
      (!path.startsWith("auth/") || path === "auth/me")
    ) {
      const refreshed = await refreshSession(refreshToken);

      if (refreshed) {
        refreshedTokens = refreshed.data;
        response = await callBackend({
          path,
          method,
          headers: pickHeaders(request),
          body,
          accessToken: refreshed.data.accessToken,
        });
      }
    }

    const payload = await parseJson<ApiEnvelope<JsonValue>>(response);
    const nextResponse = NextResponse.json(payload, { status: response.status });

    if (refreshedTokens) {
      auth.setAuthCookies(nextResponse, refreshedTokens, csrfToken ?? undefined);
    } else if (response.status === 401) {
      auth.clearAuthCookies(nextResponse);
    }

    return nextResponse;
  };

  return {
    callBackend,
    refreshSession,
    enforceCsrf,
    proxyWithRefresh,
  };
}
