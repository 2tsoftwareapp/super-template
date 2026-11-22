const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

export interface ApiResult<T> {
  status: number;
  body: T;
}

const BAD_GATEWAY = {
  status: 502,
  body: {
    error: { code: "UPSTREAM_INVALID_RESPONSE", message: "The API returned an invalid response" },
  },
};

/** One place that knows how to reach the API and what its envelope looks like. */
export async function callApi<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);

  headers.set("content-type", "application/json");

  if (init.accessToken) {
    headers.set("authorization", `Bearer ${init.accessToken}`);
  }

  const response = await fetch(`${API_INTERNAL_URL}/api/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();

  if (!text) {
    return { status: response.status, body: null as T };
  }

  try {
    return { status: response.status, body: JSON.parse(text) as T };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return BAD_GATEWAY as ApiResult<T>;
    }

    throw error;
  }
}
