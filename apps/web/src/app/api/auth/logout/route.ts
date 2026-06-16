import { NextResponse } from "next/server";
import { clearAuthCookies, readAuthCookies } from "@/lib/auth/cookies";
import type { ApiEnvelope } from "@/lib/api-types";
import { callBackend } from "@/lib/server/backend";

export async function POST() {
  const { accessToken } = await readAuthCookies();

  if (accessToken) {
    const response = await callBackend({
      path: "auth/logout",
      method: "POST",
      headers: new Headers(),
      accessToken,
    });
    const payload = (await response.json()) as ApiEnvelope<{ success: boolean }>;
    const nextResponse = NextResponse.json(payload, {
      status: response.status,
    });
    clearAuthCookies(nextResponse);
    return nextResponse;
  }

  const nextResponse = NextResponse.json({
    data: { success: true },
    meta: { requestId: crypto.randomUUID() },
  });
  clearAuthCookies(nextResponse);
  return nextResponse;
}
