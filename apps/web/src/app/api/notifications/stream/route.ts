import { NextResponse } from "next/server";

import { readAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { callBackend, refreshSession } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const { accessToken, refreshToken, csrfToken } = await readAuthCookies();
  let activeAccessToken = accessToken;
  let refreshedTokens:
    | {
        accessToken: string;
        refreshToken: string;
      }
    | null = null;

  let response = await callBackend({
    path: "notifications/stream",
    method: "GET",
    headers: new Headers({
      accept: "text/event-stream",
    }),
    accessToken: activeAccessToken,
  });

  if (response.status === 401 && refreshToken) {
    const refreshed = await refreshSession(refreshToken);

    if (refreshed) {
      refreshedTokens = refreshed.data;
      activeAccessToken = refreshed.data.accessToken;
      response = await callBackend({
        path: "notifications/stream",
        method: "GET",
        headers: new Headers({
          accept: "text/event-stream",
        }),
        accessToken: activeAccessToken,
      });
    }
  }

  if (!response.ok || !response.body) {
    return new Response(null, { status: response.status });
  }

  const streamResponse = new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });

  if (refreshedTokens) {
    setAuthCookies(streamResponse, refreshedTokens, csrfToken ?? undefined);
  }

  return streamResponse;
}
