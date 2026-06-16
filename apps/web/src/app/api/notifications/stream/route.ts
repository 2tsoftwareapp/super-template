import { readAuthCookies } from "@/lib/auth/cookies";
import { callBackend, refreshSession } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const { accessToken, refreshToken } = await readAuthCookies();
  let activeAccessToken = accessToken;

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

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
