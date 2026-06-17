"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { webFetch } from "@/lib/http";

export default function VerifyEmailPage() {
  const [token] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("token") ?? ""),
  );

  const mutation = useMutation({
    mutationFn: () =>
      webFetch("/api/bff/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: () => toast.success("Email verified"),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AuthShell
      eyebrow="Email verification"
      title="Verify email"
      body="Complete verification using the token from Mailpit."
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="p-6">
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!token}
          >
            Verify email
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
