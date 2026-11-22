import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import { badOrigin, proxyWithSession } from "@lean/next-bff";

import { isSameOrigin } from "@/lib/is-same-origin";

interface Context {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return badOrigin();
  }

  const { id } = await context.params;

  return proxyWithSession(request, `/files/${encodeURIComponent(id)}`, { method: "DELETE" });
}
