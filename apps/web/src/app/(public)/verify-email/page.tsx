"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { webFetch } from "@/lib/http";

export default function VerifyEmailPage() {
  const [token] = useState(
    () =>
      typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("token") ?? "",
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
    <div className="flex min-h-screen items-center justify-center px-6 py-8">
      <Card className="w-full max-w-lg">
        <h1 className="text-3xl font-semibold">Verify email</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Complete verification using the token from Mailpit.
        </p>
        <Button
          className="mt-8 w-full"
          onClick={() => mutation.mutate()}
          disabled={!token}
        >
          Verify email
        </Button>
      </Card>
    </div>
  );
}
