import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { proxyWithSession } from "@lean/next-bff";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyWithSession(request, `/notifications${request.nextUrl.search}`);
}
