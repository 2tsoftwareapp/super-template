import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { proxyWithSession } from "@/lib/session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyWithSession(request, `/notifications${request.nextUrl.search}`);
}
