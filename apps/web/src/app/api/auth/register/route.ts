import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import type { RegisterInput } from "@/lib/api-types";
import { callBackend } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RegisterInput;
  const response = await callBackend({
    path: "auth/register",
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
