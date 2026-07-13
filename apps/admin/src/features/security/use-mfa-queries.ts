"use client";

import { useQuery } from "@tanstack/react-query";

import type { MfaStatus } from "./model/security-schemas";

import { fetchMfaStatus } from "./api/security-api";
import { securityKeys } from "./model/security-query-keys";

export function useMfaStatusQuery() {
  return useQuery<MfaStatus>({
    queryKey: securityKeys.mfaStatus,
    queryFn: fetchMfaStatus,
  });
}
