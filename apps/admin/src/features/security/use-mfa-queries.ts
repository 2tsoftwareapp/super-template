"use client";

import { useQuery } from "@tanstack/react-query";

import type { MfaStatus } from "./model/security-schemas";

import { fetchMfaStatus } from "./api/security-api";
import { MFA_STATUS_KEY } from "./model/security-query-keys";

export function useMfaStatusQuery() {
  return useQuery<MfaStatus>({
    queryKey: MFA_STATUS_KEY,
    queryFn: fetchMfaStatus,
  });
}
