import type { NextRequest } from "next/server";

import { stripTokensFromAuthEnvelope } from "@repo/web-server/auth/sanitize-response";
import { NextResponse } from "next/server";

import type { AuthLoginResponse } from "@/lib/api-types";

import { readAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { callBackend, enforceMutationGuard } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  const body: unknown = await request.json();
  const { csrfToken } = await readAuthCookies();
  const response = await callBackend({
    path: "auth/mfa/verify-challenge",
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as AuthLoginResponse;
  const nextResponse = NextResponse.json(stripTokensFromAuthEnvelope(payload) ?? payload, {
    status: response.status,
  });

  if (response.ok && payload.data?.accessToken && payload.data?.refreshToken) {
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
