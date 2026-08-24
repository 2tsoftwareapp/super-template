import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callBackend, enforceMutationGuard, enforceOrigin } from "@/core/server/backend";

export async function POST(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  const originFailure = enforceOrigin(request);
  if (originFailure) {
    return originFailure;
  }

  const body = await request.text();
  const response = await callBackend({
    path: "auth/verify-email",
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body,
  });

  const payload: unknown = await response.json().catch(() => null);
  return NextResponse.json(payload, { status: response.status });
}
