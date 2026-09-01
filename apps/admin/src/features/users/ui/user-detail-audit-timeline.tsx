"use client";

import { Badge } from "@repo/web-ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@repo/web-ui/empty";
import { SectionLoading } from "@repo/web-ui/loading";
import { Show } from "@repo/web-ui/show";
import { Activity, Clock, ShieldCheck, UserCheck } from "lucide-react";

import { useAuditLogsQuery } from "@/features/audit-logs";
import { formatDateTime, timeAgo } from "@/lib/format";

interface UserDetailAuditTimelineProps {
  userId: string;
}

function formatEventAction(action: string): string {
  return action.replace(/\./g, " · ").replace(/_/g, " ").toUpperCase();
}

export function UserDetailAuditTimeline({ userId }: UserDetailAuditTimelineProps) {
  const auditLogs = useAuditLogsQuery({
    page: 1,
    q: userId,
  });

  const entries = auditLogs.data?.data ?? [];
  const isLoading = auditLogs.isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Audit &amp; Activity Timeline
        </CardTitle>
        <CardDescription>
          Recent security events, authentication, and permission modifications recorded for this
          user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Show when={isLoading}>
          <div className="py-6">
            <SectionLoading />
          </div>
        </Show>

        {!isLoading && entries.length === 0 ? (
          <Empty className="py-6">
            <EmptyContent>
              <EmptyHeader>
                <EmptyTitle>No activity recorded yet</EmptyTitle>
              </EmptyHeader>
            </EmptyContent>
          </Empty>
        ) : null}

        {!isLoading && entries.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="relative flex items-start gap-3 text-sm">
                <div className="absolute -left-6 mt-1 flex size-5 items-center justify-center rounded-full border border-border bg-background">
                  <span className="size-2 rounded-full bg-primary" />
                </div>
                <div className="flex-1 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0">
                        {formatEventAction(entry.action)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{entry.entityType}</span>
                    </div>
                    <span
                      className="text-xs text-muted-foreground flex items-center gap-1"
                      title={formatDateTime(entry.createdAt)}
                    >
                      <Clock className="size-3" />
                      {timeAgo(entry.createdAt)}
                    </span>
                  </div>
                  {entry.actorId ? (
                    <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                      <UserCheck className="size-3" />
                      Actor: <span className="font-mono">{entry.actorId}</span>
                    </p>
                  ) : null}
                  {entry.ipAddress ? (
                    <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="size-3" />
                      IP: <span className="font-mono">{entry.ipAddress}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
