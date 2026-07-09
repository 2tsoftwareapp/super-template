import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callBackend, enforceMutationGuard } from "@/lib/server/backend";

export async function PATCH(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  const body = await request.text();
  const response = await callBackend({
    path: "users/me/password",
    method: "PATCH",
    headers: new Headers({ "content-type": "application/json" }),
    body,
  });

  const payload: unknown = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
