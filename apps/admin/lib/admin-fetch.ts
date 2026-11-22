const ROTATION_RETRY_DELAY_MS = 300;

/**
 * Browser-side fetch for BFF routes. When several requests hit an expired
 * access token at once, one refresh wins and the others get
 * AUTH_SESSION_ROTATED; by the time they retry, the winner's cookies are set.
 */
export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(path, init);

  if (response.status !== 401) {
    return response;
  }

  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as { error?: { code?: string } } | null;

  if (body?.error?.code !== "AUTH_SESSION_ROTATED") {
    return response;
  }

  await new Promise((resolve) => setTimeout(resolve, ROTATION_RETRY_DELAY_MS));

  return fetch(path, init);
}
