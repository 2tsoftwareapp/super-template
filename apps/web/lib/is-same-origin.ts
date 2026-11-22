import type { NextRequest } from "next/server";

import { isSameOrigin as matchesOrigin } from "@lean/next-bff";

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

export function isSameOrigin(request: NextRequest): boolean {
  return matchesOrigin(request, WEB_ORIGIN);
}
