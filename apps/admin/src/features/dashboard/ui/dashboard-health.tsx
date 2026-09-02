import { Badge } from "@repo/web-ui/badge";
import { Card, CardContent, CardHeader } from "@repo/web-ui/card";
import { CheckCircle2, Database, HardDrive, Layers, Server, ShieldCheck, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardHealthProps {
  apiHealthy: boolean;
  dbHealthy: boolean;
  failedJobs: number;
  pendingJobs: number;
}

export function DashboardHealth({
  apiHealthy,
  dbHealthy,
  failedJobs,
  pendingJobs,
}: DashboardHealthProps) {
  const allHealthy = apiHealthy && dbHealthy && failedJobs === 0;

  const services = [
    {
      label: "API Server",
      description: "NestJS Modular Monolith",
      icon: Server,
      ok: apiHealthy,
      detail: apiHealthy ? "Healthy (REST)" : "Unreachable",
    },
    {
      label: "Primary Database",
      description: "PostgreSQL with Tenant RLS",
      icon: Database,
      ok: dbHealthy,
      detail: dbHealthy ? "Connected" : "Connection error",
    },
    {
      label: "Queue & Background Jobs",
      description: "Redis / BullMQ Queue Engine",
      icon: Workflow,
      ok: failedJobs === 0,
      detail: failedJobs > 0 ? `${failedJobs} failed jobs` : `${pendingJobs} pending tasks`,
    },
  ];

  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Infrastructure</h3>
          </div>
          <p className="text-xs text-muted-foreground">Live health of system runtimes</p>
        </div>

        <Badge
          variant={allHealthy ? "default" : "destructive"}
          className="px-2 py-0.5 text-[10px] font-medium"
        >
          {allHealthy ? "All Normal" : "Degraded"}
        </Badge>
      </CardHeader>

      <CardContent className="divide-y divide-border/60 p-0">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.label}
              className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                    service.ok
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border-destructive/20",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {service.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  {service.detail}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                    service.ok
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-destructive/10 text-destructive border-destructive/30",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      service.ok ? "bg-emerald-500 animate-pulse" : "bg-destructive",
                    )}
                  />
                  {service.ok ? "OK" : "Issue"}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
