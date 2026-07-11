import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";
  const response = await fetch(`${apiUrl}/api/v1/auth/verify-email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
