import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callApi } from "@/lib/backend";
import { setSessionCookies } from "@/lib/cookies";
import { isSameOrigin } from "@/lib/is-same-origin";

interface LoginBody {
  email?: string;
  password?: string;
}

interface SessionPayload {
  data?: { accessToken: string; refreshToken: string; user: unknown };
  error?: { code: string; message: string };
}

async function readLoginBody(request: NextRequest): Promise<LoginBody | null> {
  try {
    return (await request.json()) as LoginBody;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { code: "AUTH_FORBIDDEN", message: "Bad origin" } },
      { status: 403 },
    );
  }

  const body = await readLoginBody(request);

  if (!body) {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Body must be JSON" } },
      { status: 400 },
    );
  }

  const result = await callApi<SessionPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (result.status !== 200 || !result.body.data) {
    return NextResponse.json(result.body, { status: result.status });
  }

  const response = NextResponse.json({ data: { user: result.body.data.user } });
  setSessionCookies(response, result.body.data);

  return response;
}
