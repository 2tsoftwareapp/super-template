import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import { downloadWithSession } from "@lean/next-bff";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const { id } = await context.params;

  return downloadWithSession(request, `/files/${encodeURIComponent(id)}/download`);
}
