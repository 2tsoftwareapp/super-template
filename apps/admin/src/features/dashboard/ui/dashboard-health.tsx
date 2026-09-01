import { Card, CardContent, CardHeader, CardTitle } from "@repo/web-ui/card";

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
  return (
    <Card size="sm" className="shrink-0">
      <CardHeader className="border-b pb-0">
        <CardTitle>System health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 py-0">
        {[
          { label: "API", ok: apiHealthy },
          { label: "Database", ok: dbHealthy },
          {
            label: "Redis / Queue",
            ok: failedJobs === 0,
            detail: failedJobs > 0 ? `${failedJobs} failed` : `${pendingJobs} pending`,
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2 text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.detail ? (
                <span className="text-[10px] text-muted-foreground">{item.detail}</span>
              ) : null}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[10px] font-semibold",
                  item.ok ? "text-primary" : "text-destructive",
                )}
              >
                <span
                  className={cn("size-1.5 rounded-full", item.ok ? "bg-primary" : "bg-destructive")}
                />
                {item.ok ? "OK" : "Issue"}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
