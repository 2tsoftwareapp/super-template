"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { sessionQueryKey } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";

export function SsoCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const called = useRef(false);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const provider =
    searchParams.get("provider") ??
    (typeof window !== "undefined"
      ? sessionStorage.getItem("sso_provider")
      : null) ??
    "google";

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!code) {
      router.replace("/login?error=sso_failed");
      return;
    }

    async function handleCallback() {
      try {
        await webFetch(
          `/api/auth/sso/${provider}/callback?code=${encodeURIComponent(code!)}&state=${encodeURIComponent(state ?? "")}`,
        );
        sessionStorage.removeItem("sso_provider");
        await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
        router.replace("/");
      } catch {
        sessionStorage.removeItem("sso_provider");
        router.replace("/login?error=sso_failed");
      }
    }

    void handleCallback();
  }, [code, state, provider, router, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
