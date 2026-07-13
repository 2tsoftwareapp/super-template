"use client";

import { getCsrfBootstrapPath } from "@repo/web-utils/http-config";
import { getCsrfTokenFromDocument } from "@repo/web-utils/utils";
import { useEffect } from "react";

export function CsrfBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.location?.origin) {
      return;
    }

    if (getCsrfTokenFromDocument()) {
      return;
    }

    const url = `${window.location.origin}${getCsrfBootstrapPath()}`;
    void fetch(url, { credentials: "same-origin" }).catch(() => undefined);
  }, []);

  return null;
}
