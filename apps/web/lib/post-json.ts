import { errorMessage, sendJson } from "@lean/next-bff/client";

/** Resolves to the error message to show, or null when the BFF answered 2xx. */
export async function postJson(
  path: string,
  body: unknown,
  method = "POST",
): Promise<string | null> {
  const response = await sendJson(path, method, body);

  return response.ok ? null : errorMessage(response, "Something went wrong, try again");
}
