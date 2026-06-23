"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const session = useSession();

  const accept = useMutation({
    mutationFn: () =>
      webFetch("/api/bff/invitations/accept", {
        method: "POST",
        body: JSON.stringify({
          token: params.token,
        }),
      }),
    onSuccess: () =>
      toast.success(
        "Invitation accepted. You can now switch to the new organization.",
      ),
    onError: (error: Error) => toast.error(error.message),
  });

  const isSignedIn = Boolean(session.data?.data.user.id);

  return (
    <AuthShell
      eyebrow="Invitation"
      title="Accept invitation"
      body="Sign in with the invited email address, then accept the organization invitation."
    >
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Join organization</CardTitle>
          <CardDescription>
            Organization invitations are tied to the invited account and can
            only be accepted after sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSignedIn ? (
            <Button
              className="w-full"
              onClick={() => accept.mutate()}
              disabled={accept.isPending}
            >
              Accept invitation
            </Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in or register with the invited email before accepting this
                invitation.
              </p>
              <div className="flex gap-3">
                <Link
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
                  href="/login"
                >
                  Sign in
                </Link>
                <Link
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium"
                  href="/register"
                >
                  Register
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
