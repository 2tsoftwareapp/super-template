"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { webFetch } from "@/lib/http";
import { getPostLoginPath } from "@/lib/navigation";

function readHashParams(): URLSearchParams {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export function SsoCallbackView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const handleCallback = useCallback(async () => {
    if (searchParams.get("error") === "sso_failed") {
      setError("SSO sign-in failed.");
      return;
    }

    const hashParams = readHashParams();
    const accessToken = hashParams.get("accessToken");
    const refreshToken = hashParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      setError("Missing SSO session tokens.");
      return;
    }

    try {
      await webFetch("/api/auth/sso/establish-session", {
        method: "POST",
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Signed in successfully.");
      router.replace(getPostLoginPath());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "SSO sign-in failed.";
      setError(message);
      toast.error(message);
    }
  }, [searchParams, queryClient, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- OAuth callback runs once on mount
    void handleCallback();
  }, [handleCallback]);

  return (
    <AuthShell
      eyebrow="SSO callback"
      title="Completing sign-in"
      body={
        error ?? "Processing your authentication. Please wait a moment..."
      }
    >
      <div />
    </AuthShell>
  );
}
