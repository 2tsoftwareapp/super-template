import type { NextRequest } from "next/server";

import { enforceMutationGuard, proxyWithRefresh } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  return proxyWithRefresh(request, "auth/mfa/setup");
}
