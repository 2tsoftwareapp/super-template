import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callBackend, enforceMutationGuard } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  const response = await callBackend({
    path: "auth/mfa/setup",
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
  });

  const payload: unknown = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
