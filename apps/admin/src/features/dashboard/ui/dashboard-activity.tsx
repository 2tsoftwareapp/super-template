import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardHeader } from "@repo/web-ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import {
  Activity,
  ArrowRight,
  Clock,
  FileText,
  KeyRound,
  LogIn,
  Mail,
  Shield,
  Upload,
  Users,
  Workflow,
} from "lucide-react";

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
    <Card className="rounded-xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Recent Activity</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Live audit and security log stream across your workspace
          </p>
        </div>

        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground" asChild>
          <Link href="/audit-logs">
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <SectionLoading title="Loading recent activities..." className="min-h-36" />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ErrorState
              variant="inline"
              className="m-0"
              title="Could not load activity feed."
              action={{ label: "Retry", onClick: onRetry }}
            />
          </div>
        ) : recentActivity.length === 0 ? (
          <Empty className="py-10">
            <EmptyContent>
              <EmptyHeader>
                <EmptyTitle>No recent activities recorded</EmptyTitle>
              </EmptyHeader>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="divide-y divide-border/60">
            {recentActivity.map((entry) => {
              const { icon, bgClass, textClass, category } = auditIcon(entry.action);
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                        bgClass,
                        textClass,
                      )}
                    >
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {formatAction(entry.action)}
                        </p>
                        <Badge variant="outline" className="hidden px-1.5 py-0 text-[9px] font-normal sm:inline-flex">
                          {category}
                        </Badge>
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        Target: <span className="font-mono text-[10px] text-foreground/80">{entry.entityType}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3 text-muted-foreground/60" />
                    <span>{timeAgo(entry.createdAt)}</span>
                  </div>
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
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function auditIcon(action: string) {
  if (action.startsWith("user")) {
    return {
      category: "User",
      icon: <Users className="size-3.5" />,
      bgClass: "bg-emerald-500/10 border-emerald-500/20",
      textClass: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (action.startsWith("auth") || action.startsWith("login")) {
    return {
      category: "Auth",
      icon: <LogIn className="size-3.5" />,
      bgClass: "bg-blue-500/10 border-blue-500/20",
      textClass: "text-blue-600 dark:text-blue-400",
    };
  }
  if (action.startsWith("job")) {
    return {
      category: "Queue",
      icon: <Workflow className="size-3.5" />,
      bgClass: "bg-violet-500/10 border-violet-500/20",
      textClass: "text-violet-600 dark:text-violet-400",
    };
  }
  if (action.startsWith("mail")) {
    return {
      category: "Mail",
      icon: <Mail className="size-3.5" />,
      bgClass: "bg-sky-500/10 border-sky-500/20",
      textClass: "text-sky-600 dark:text-sky-400",
    };
  }
  if (action.startsWith("file") || action.startsWith("upload")) {
    return {
      category: "Storage",
      icon: <Upload className="size-3.5" />,
      bgClass: "bg-amber-500/10 border-amber-500/20",
      textClass: "text-amber-600 dark:text-amber-400",
    };
  }
  if (action.startsWith("role") || action.startsWith("permission") || action.startsWith("security")) {
    return {
      category: "Security",
      icon: <Shield className="size-3.5" />,
      bgClass: "bg-rose-500/10 border-rose-500/20",
      textClass: "text-rose-600 dark:text-rose-400",
    };
  }

  return {
    category: "System",
    icon: <Activity className="size-3.5" />,
    bgClass: "bg-muted/80 border-border",
    textClass: "text-muted-foreground",
  };
}
