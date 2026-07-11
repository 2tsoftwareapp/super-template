interface AuthTokenFields {
  accessToken?: string;
  refreshToken?: string;
}

export function stripTokensFromAuthData<T extends object>(
  data: T | null | undefined,
): Omit<T, "accessToken" | "refreshToken"> | null {
  if (!data) {
    return null;
  }

  const { accessToken: _accessToken, refreshToken: _refreshToken, ...rest } =
    data as T & AuthTokenFields;
  return rest;
}

export function stripTokensFromAuthEnvelope<
  T extends object,
  TEnvelope extends { data?: T | null; error?: unknown; meta?: unknown },
>(payload: TEnvelope | null | undefined): TEnvelope | null | undefined {
  if (!payload?.data) {
    return payload;
  }

  return {
    ...payload,
    data: stripTokensFromAuthData(payload.data) as TEnvelope["data"],
  };
}
