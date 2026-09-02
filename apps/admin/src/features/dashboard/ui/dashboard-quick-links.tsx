import { Card, CardContent, CardHeader } from "@repo/web-ui/card";
import {
  ArrowUpRight,
  Building2,
  Folder,
  Layers,
  Mail,
  Megaphone,
  Shield,
  Sparkles,
  Upload,
  Users,
  Workflow,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  {
    href: "/users",
    label: "User Directory",
    description: "Manage accounts, roles & status",
    icon: Users,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    href: "/organizations",
    label: "Organizations",
    description: "Tenants, members & domains",
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    href: "/roles",
    label: "Access & Roles",
    description: "RBAC matrix & custom scopes",
    icon: Shield,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    href: "/jobs",
    label: "Background Jobs",
    description: "BullMQ queues & failed retries",
    icon: Workflow,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    href: "/mail",
    label: "Mail & Templates",
    description: "Transactional delivery & logs",
    icon: Mail,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    href: "/notifications",
    label: "Notifications",
    description: "Broadcasts & system alerts",
    icon: Megaphone,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    href: "/files",
    label: "File Storage",
    description: "Assets, uploads & metadata",
    icon: Folder,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    href: "/imports",
    label: "Data Imports",
    description: "Batch CSV/JSON processing",
    icon: Upload,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
] as const;

export function DashboardQuickLinks() {
  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Platform Shortcuts</h3>
          </div>
          <p className="text-xs text-muted-foreground">Quick access to operational modules</p>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex items-start gap-3 rounded-xl border border-border/70 bg-background/50 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-accent/40 hover:shadow-xs"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105",
                    item.bg,
                    item.color,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <ArrowUpRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
