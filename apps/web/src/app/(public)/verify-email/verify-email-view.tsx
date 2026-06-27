"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { webFetch } from "@/lib/http";

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const mutation = useMutation({
    mutationFn: () =>
      webFetch("/api/bff/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: () => toast.success("Email verified successfully."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AuthShell
      eyebrow="Email verification"
      title="Verify your email"
      body="Click the button below to confirm your email address and activate your account."
      footer={
        <p className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {mutation.isSuccess ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-10 text-green-500" />
          <p className="text-sm text-muted-foreground">
            Your email has been verified. You can now sign in to your account.
          </p>
          <Button
            className="mt-2 w-full"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Go to sign in
          </Button>
        </div>
      ) : mutation.isError ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <XCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">
            The verification link is invalid or has expired. Request a new one
            from your account settings.
          </p>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => mutation.reset()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {!token && (
            <p className="text-sm text-muted-foreground">
              No verification token found. Make sure you followed the link from
              your email.
            </p>
          )}
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!token || mutation.isPending}
          >
            {mutation.isPending ? "Verifying…" : "Verify email"}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
