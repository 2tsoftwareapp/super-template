"use client";

import { ensureCsrfToken } from "@repo/web-utils/http";
import { useEffect } from "react";

/** Ensure the CSRF cookie exists before the first mutating request. */
export function useCsrfBootstrap(): void {
  useEffect(() => {
    void ensureCsrfToken();
  }, []);
}
