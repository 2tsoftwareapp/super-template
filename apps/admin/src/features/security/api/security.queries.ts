"use client";

import { useQuery } from "@tanstack/react-query";

import type { MfaStatusResponse } from "../model/security.types";

import { securityApi } from "./security.api";
import { securityKeys } from "./security.query-keys";

/** Reads MFA state without retaining sensitive status data in cache. */
export function useMfaStatusQuery() {
  return useQuery<MfaStatusResponse>({
    queryKey: securityKeys.mfaStatus(),
    queryFn: securityApi.fetchMfaStatus,
    staleTime: 0,
    gcTime: 0,
  });
}
