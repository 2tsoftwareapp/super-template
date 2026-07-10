"use client";

import { useEffect } from "react";

import { getCsrfBootstrapPath } from "../http-config";
import { getCsrfTokenFromDocument } from "../utils";

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
