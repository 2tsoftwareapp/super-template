import { NextResponse } from "next/server";

import { setCsrfCookie } from "@/core/auth/server/csrf";

export function GET() {
  const response = NextResponse.json({
    data: { ok: true },
    meta: { requestId: crypto.randomUUID() },
  });

  setCsrfCookie(response);
  return response;
}
