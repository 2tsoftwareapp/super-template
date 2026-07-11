import { Mail, Megaphone, Shield, Users, Workflow } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      <CardContent className="flex flex-wrap items-center gap-1.5 py-0">
        <span className="mr-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Quick
        </span>
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.href}
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              render={<Link href={item.href} />}
            >
              <Icon className="size-3" />
              {item.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
