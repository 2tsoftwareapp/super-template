import type { NextRequest } from "next/server";

import { proxyWithRefresh } from "@/lib/server/backend";

export async function GET(request: NextRequest) {
  return proxyWithRefresh(request, "auth/me");
}
