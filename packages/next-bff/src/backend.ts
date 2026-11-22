const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

export interface ApiResult<T> {
  status: number;
  body: T;
}

export type ApiInit = RequestInit & { accessToken?: string };

const BAD_GATEWAY = {
  status: 502,
  body: {
    error: { code: "UPSTREAM_INVALID_RESPONSE", message: "The API returned an invalid response" },
  },
};

/** Raw call to `${API_INTERNAL_URL}/api/v1${path}`; used directly for binary downloads. */
export async function fetchApi(path: string, init: ApiInit = {}): Promise<Response> {
  const { accessToken, ...rest } = init;
  const headers = new Headers(rest.headers);

  headers.set("content-type", "application/json");

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_INTERNAL_URL}/api/v1${path}`, { ...rest, headers, cache: "no-store" });
}

/** One place that knows how to reach the API and what its envelope looks like. */
export async function callApi<T>(path: string, init: ApiInit = {}): Promise<ApiResult<T>> {
  const response = await fetchApi(path, init);
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
