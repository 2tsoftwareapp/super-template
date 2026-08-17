import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { Activity, ArrowRight, LogIn, Mail, Users, Workflow } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
}

interface DashboardActivityProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  recentActivity: AuditLog[];
}

export function DashboardActivity({
  isLoading,
  isError,
  onRetry,
  recentActivity,
}: DashboardActivityProps) {
  return (
    <Card size="sm" className="flex min-h-0 flex-col">
      <CardHeader className="border-b pb-0">
        <CardTitle>Recent activity</CardTitle>
        <CardAction>
          <Link
            href="/audit-logs"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            All <ArrowRight className="inline size-3" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto py-0">
        {isLoading ? (
          <SectionLoading title="Loading activities..." className="min-h-32" />
        ) : isError ? (
          <ErrorState
            variant="inline"
            className="mx-0 mb-2 mt-2"
            title="Could not load recent activity."
            action={{ label: "Retry", onClick: onRetry }}
          />
        ) : recentActivity.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No recent activity</p>
        ) : (
          <div className="divide-y divide-border">
            {recentActivity.map((entry) => {
              const { icon, c } = auditIcon(entry.action);
              return (
                <div key={entry.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                  <span className={cn("shrink-0", c)}>{icon}</span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-xs font-medium">{formatAction(entry.action)}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{entry.entityType}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {timeAgo(entry.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function auditIcon(action: string) {
  if (action.startsWith("user")) return { icon: <Users className="size-3" />, c: "text-chart-2" };
  if (action.startsWith("auth") || action.startsWith("login"))
    return { icon: <LogIn className="size-3" />, c: "text-primary" };
  if (action.startsWith("job")) return { icon: <Workflow className="size-3" />, c: "text-chart-5" };
  if (action.startsWith("mail")) return { icon: <Mail className="size-3" />, c: "text-chart-3" };
  return {
    icon: <Activity className="size-3" />,
    c: "text-muted-foreground",
  };
}
