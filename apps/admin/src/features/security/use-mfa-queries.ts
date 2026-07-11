"use client";

import { useQuery } from "@tanstack/react-query";

import type { MfaStatus } from "./security-schemas";

import { fetchMfaStatus } from "./security-service";

export const MFA_STATUS_KEY = ["mfa-status"] as const;

export function useMfaStatusQuery() {
  return useQuery<MfaStatus>({
    queryKey: MFA_STATUS_KEY,
    queryFn: fetchMfaStatus,
  });
}
