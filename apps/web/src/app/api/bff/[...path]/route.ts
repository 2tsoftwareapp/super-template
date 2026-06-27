import type { NextRequest } from "next/server";

import { enforceCsrf, proxyWithRefresh } from "@/lib/server/backend";

const normalizePath = (segments: string[]) => segments.join("/");

/** Forward query string as-is — no list-param normalization needed. */
const buildProxyPath = (path: string, searchParams: URLSearchParams) => {
  const qs = searchParams.toString();
  return qs ? `${path}?${qs}` : path;
};

async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const proxyPath = buildProxyPath(
    normalizePath(path),
    request.nextUrl.searchParams,
  );

  if (
    proxyPath.includes("..") ||
    proxyPath.startsWith("http://") ||
    proxyPath.startsWith("https://")
  ) {
    return Response.json(
      {
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Invalid proxy path",
          details: null,
        },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 400 },
    );
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    const csrfFailure = await enforceCsrf(request);
    if (csrfFailure) {
      return csrfFailure;
    }
  }

  return proxyWithRefresh(request, proxyPath);
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
