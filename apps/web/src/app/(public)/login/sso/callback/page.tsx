"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { webFetch } from "@/lib/http";
import { getPostLoginPath } from "@/lib/navigation";

export default function SsoCallbackPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const handleCallback = useCallback(async () => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const provider = searchParams.get("provider") ?? "google";

    if (!code || !state) {
      setError("Missing OAuth parameters.");
      return;
    }

    try {
      await webFetch(
        `/api/auth/sso/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      );

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
    handleCallback();
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
