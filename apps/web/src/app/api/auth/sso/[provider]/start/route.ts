import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { ApiEnvelope } from "@/lib/api-types";

import { callBackend } from "@/lib/server/backend";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirectUri");

  if (!redirectUri) {
    return NextResponse.json(
      {
        error: { code: "VALIDATION_ERROR", message: "redirectUri is required", details: null },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 400 },
    );
  }

  const response = await callBackend({
    path: `auth/sso/${provider}/start?redirectUri=${encodeURIComponent(redirectUri)}`,
    method: "GET",
  });

  const payload = (await response.json()) as ApiEnvelope<unknown>;
  return NextResponse.json(payload, { status: response.status });
}
