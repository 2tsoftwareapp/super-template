import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import { badOrigin, endSession } from "@lean/next-bff";

import { isSameOrigin } from "@/lib/is-same-origin";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return isSameOrigin(request) ? endSession(request) : badOrigin();
}
