import { env } from "@/lib/env";
import { readAuthCookies } from "@/lib/server/backend";

/**
 * Streaming proxy for the backend SSE endpoint (`GET /api/v1/notifications/stream`).
 *
 * The generic BFF proxy (`/api/bff/[...path]`) buffers and parses JSON, which
 * breaks Server-Sent Events. This route streams the upstream body verbatim so
 * the notifications screen can subscribe with `EventSource`.
 */
export async function GET() {
  const { accessToken } = await readAuthCookies();

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const upstream = await fetch(
    `${env.API_INTERNAL_URL}/api/v1/notifications/stream`,
    {
      headers: {
        accept: "text/event-stream",
        authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream stream unavailable", {
      status: upstream.status,
    });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
