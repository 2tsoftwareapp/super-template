import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import { proxyWithSession } from "@lean/next-bff";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyWithSession(request, `/files${request.nextUrl.search}`);
}
