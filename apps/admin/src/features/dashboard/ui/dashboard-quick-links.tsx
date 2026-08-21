import { Button } from "@repo/web-ui/button";
import { Card, CardContent } from "@repo/web-ui/card";
import { Mail, Megaphone, Shield, Users, Workflow } from "lucide-react";

import { Link } from "@/i18n/navigation";

const QUICK_ACTIONS = [
  { href: "/users", label: "Users", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Workflow },
  { href: "/mail", label: "Mail", icon: Mail },
  { href: "/notifications", label: "Notify", icon: Megaphone },
  { href: "/audit-logs", label: "Audit", icon: Shield },
] as const;

export function DashboardQuickLinks() {
  return (
    <Card size="sm" className="shrink-0">
      <CardContent className="flex flex-wrap items-center gap-2 py-1">
        <span className="mr-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Quick
        </span>
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.href}
              variant="secondary"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs font-medium"
              asChild
            >
              <Link href={item.href}>
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
