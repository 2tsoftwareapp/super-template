import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/is-same-origin";
import { proxyWithSession } from "@lean/next-bff";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const { id } = await context.params;

  return proxyWithSession(request, `/users/${id}`);
}

export async function PATCH(request: NextRequest, context: Context): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { code: "AUTH_FORBIDDEN", message: "Bad origin" } },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  return proxyWithSession(request, `/users/${id}`, { method: "PATCH", body: await request.text() });
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { code: "AUTH_FORBIDDEN", message: "Bad origin" } },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  return proxyWithSession(request, `/users/${id}`, { method: "DELETE" });
}
