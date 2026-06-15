"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AuthSessionsResponse } from "@/lib/api-types";
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
      <h1 className="text-4xl font-semibold">Active sessions</h1>
      {sessions.data?.data.map((session) => (
        <Card key={session.id}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {typeof session.userAgent === "string"
                  ? session.userAgent
                  : "Unknown device"}
              </p>
              <p className="text-sm text-neutral-500">
                {typeof session.ipAddress === "string"
                  ? session.ipAddress
                  : "Unknown IP"}
              </p>
            </div>
            {!session.current ? (
              <Button
                variant="secondary"
                onClick={() => revokeSession.mutate(session.id)}
              >
                Revoke
              </Button>
            ) : (
              <span className="text-xs uppercase tracking-[0.24em] text-neutral-400">
                Current
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
