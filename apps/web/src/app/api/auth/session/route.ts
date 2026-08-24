import type { NextRequest } from "next/server";

import { proxyWithRefresh } from "@/core/server/proxy";

export async function GET(request: NextRequest) {
  return proxyWithRefresh(request, "auth/me");
}
