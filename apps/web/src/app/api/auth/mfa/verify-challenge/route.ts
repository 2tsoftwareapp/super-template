import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { callBackend } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const response = await callBackend({
    path: "auth/mfa/verify-challenge",
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body,
  });

  const payload = await response.json();
  const nextResponse = NextResponse.json(payload, { status: response.status });

  if (
    response.ok &&
    payload?.data?.accessToken &&
    payload?.data?.refreshToken
  ) {
    setAuthCookies(nextResponse, {
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
    });
  } else {
    clearAuthCookies(nextResponse);
  }

  return nextResponse;
}
