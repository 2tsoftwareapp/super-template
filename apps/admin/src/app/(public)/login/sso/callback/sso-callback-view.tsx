"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { sessionQueryKey } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";

function readHashParams(): URLSearchParams {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export function SsoCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (searchParams.get("error") === "sso_failed") {
      router.replace("/login?error=sso_failed");
      return;
    }

    async function handleCallback() {
      const hashParams = readHashParams();
      const accessToken = hashParams.get("accessToken");
      const refreshToken = hashParams.get("refreshToken");

      if (!accessToken || !refreshToken) {
        router.replace("/login?error=sso_failed");
        return;
      }

      try {
        await webFetch("/api/auth/sso/establish-session", {
          method: "POST",
          body: JSON.stringify({ accessToken, refreshToken }),
        });

        sessionStorage.removeItem("sso_provider");
        await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
        router.replace("/");
      } catch {
        sessionStorage.removeItem("sso_provider");
        router.replace("/login?error=sso_failed");
      }
    }

    void handleCallback();
  }, [searchParams, router, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
