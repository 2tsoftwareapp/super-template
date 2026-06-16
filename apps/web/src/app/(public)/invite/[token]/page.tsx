"use client";

import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webFetch } from "@/lib/http";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const accept = useMutation({
    mutationFn: () =>
      webFetch("/api/bff/invitations/accept", {
        method: "POST",
        body: JSON.stringify({
          token: params.token,
          password,
          displayName,
        }),
      }),
    onSuccess: () => toast.success("Invitation accepted. You can sign in now."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AuthShell
      eyebrow="Invitation"
      title="Accept invitation"
      body="Create your account to join the starter."
    >
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Join starter</CardTitle>
          <CardDescription>
            Complete your profile to accept the invite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => accept.mutate()}
            disabled={accept.isPending}
          >
            Accept invitation
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
