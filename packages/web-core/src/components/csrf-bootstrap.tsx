"use client";

import { useEffect } from "react";

export function CsrfBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.location?.origin) {
      return;
    }

    const url = `${window.location.origin}/api/auth/csrf`;
    void fetch(url, { credentials: "same-origin" }).catch(() => undefined);
  }, []);

  return null;
}
