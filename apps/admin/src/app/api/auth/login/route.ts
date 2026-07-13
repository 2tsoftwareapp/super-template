import type { NextRequest } from "next/server";

import { stripTokensFromAuthEnvelope } from "@repo/web-server/auth/sanitize-response";
import { NextResponse } from "next/server";

import type { AuthLoginResponse, LoginInput } from "@/lib/api-types";

import {
  clearSessionCookies,
  readAuthCookies,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { callBackend, enforceMutationGuard } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  const body = (await request.json()) as LoginInput;
  const { csrfToken } = await readAuthCookies();
  const response = await callBackend({
    path: "auth/login",
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as AuthLoginResponse;
  const nextResponse = NextResponse.json(
    stripTokensFromAuthEnvelope(payload) ?? payload,
    { status: response.status },
  );

  if (!response.ok) {
    clearSessionCookies(nextResponse);
    return nextResponse;
  }

  if (payload.data.accessToken && payload.data.refreshToken) {
    setAuthCookies(
      nextResponse,
      {
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
      },
      csrfToken ?? undefined,
    );
  }

  return nextResponse;
}
