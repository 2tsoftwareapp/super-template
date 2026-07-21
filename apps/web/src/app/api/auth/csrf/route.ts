import { NextResponse } from "next/server";

import { setCsrfCookie } from "@/lib/auth/cookies";

export function GET() {
  const response = NextResponse.json({
    data: { ok: true },
    meta: { requestId: crypto.randomUUID() },
  });

  setCsrfCookie(response);
  return response;
}
