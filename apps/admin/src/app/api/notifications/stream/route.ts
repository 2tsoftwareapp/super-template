import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth/cookies";
import { env } from "@/lib/env";
import { readAuthCookies, refreshSession } from "@/lib/server/backend";

const STREAM_HEADERS = {
  "content-type": "text/event-stream",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
  "x-accel-buffering": "no",
};

const openStream = (accessToken: string) =>
  fetch(`${env.API_INTERNAL_URL}/api/v1/notifications/stream`, {
    headers: {
      accept: "text/event-stream",
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

/**
 * Streaming proxy for the backend SSE endpoint (`GET /api/v1/notifications/stream`).
 *
 * The generic BFF proxy (`/api/bff/[...path]`) buffers and parses JSON, which
 * breaks Server-Sent Events. This route streams the upstream body verbatim so
 * the notifications screen can subscribe with `EventSource`.
 *
 * `EventSource` reconnects on its own, but it always resends the (expired)
 * cookie unless this route rotates it. Without the refresh branch every stream
 * died after the 15-minute access-token TTL and retried 401s forever.
 */
export async function GET() {
  const { accessToken, refreshToken, csrfToken } = await readAuthCookies();

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  let upstream = await openStream(accessToken);
  let refreshedTokens: { accessToken: string; refreshToken: string } | null = null;

  if (upstream.status === 401 && refreshToken) {
    const refreshed = await refreshSession(refreshToken);

    if (refreshed) {
      refreshedTokens = refreshed.data;
      upstream = await openStream(refreshed.data.accessToken);
    }
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream stream unavailable", {
      status: upstream.status,
    });
  }

  const response = new NextResponse(upstream.body, { headers: STREAM_HEADERS });

  if (refreshedTokens) {
    setAuthCookies(response, refreshedTokens, csrfToken ?? undefined);
  }

  return response;
}
