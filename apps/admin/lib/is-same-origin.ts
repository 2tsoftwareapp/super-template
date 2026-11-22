import type { NextRequest } from "next/server";

import { isSameOrigin as matchesOrigin } from "@lean/next-bff";

const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN ?? "http://localhost:3002";

export function isSameOrigin(request: NextRequest): boolean {
  return matchesOrigin(request, ADMIN_ORIGIN);
}
