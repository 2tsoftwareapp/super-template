import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import { badOrigin, forwardPublic } from "@lean/next-bff";

import { isSameOrigin } from "@/lib/is-same-origin";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return isSameOrigin(request) ? forwardPublic(request, "/auth/forgot-password") : badOrigin();
}
