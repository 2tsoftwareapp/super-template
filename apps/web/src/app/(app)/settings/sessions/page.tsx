"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Laptop2 } from "lucide-react";
import { toast } from "sonner";

import type { AuthSessionsResponse } from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { webFetch } from "@/lib/http";

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => webFetch<AuthSessionsResponse>("/api/bff/auth/sessions"),
  });
  const revokeSession = useMutation({
    mutationFn: (sessionId: string) =>
      webFetch(`/api/bff/auth/sessions/${sessionId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session revoked");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <Badge variant="outline" className="w-fit">
        Active sessions
      </Badge>
      <h1 className="text-4xl font-semibold">Active sessions</h1>
      {sessions.data?.data.length ? (
        sessions.data.data.map((session) => (
          <Card key={session.id} className="border-border">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">
                  {typeof session.userAgent === "string"
                    ? session.userAgent
                    : "Unknown device"}
                </CardTitle>
                <CardDescription>
                  {typeof session.ipAddress === "string"
                    ? session.ipAddress
                    : "Unknown IP"}
                </CardDescription>
              </div>
              {!session.current ? (
                <Button
                  variant="outline"
                  onClick={() => revokeSession.mutate(session.id)}
                >
                  Revoke
                </Button>
              ) : (
                <Badge>Current</Badge>
              )}
            </CardHeader>
          </Card>
        ))
      ) : (
        <Card className="border-border">
          <CardContent className="py-10">
            <Empty className="border-border bg-muted/30">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Laptop2 className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No active sessions</EmptyTitle>
                <EmptyDescription>
                  Sign in from another device to see sessions here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
