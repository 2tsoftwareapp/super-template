"use client";

import { Building, Shield, User } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    id: "profile",
    label: "Profile",
    href: "/settings",
    icon: User,
    description: "Account details and display preferences",
  },
  {
    id: "security",
    label: "Security",
    href: "/settings/security",
    icon: Shield,
    description: "Password, MFA, and login settings",
  },
  {
    id: "organization",
    label: "Organization",
    href: "/settings/organization",
    icon: Building,
    description: "Team and organization settings",
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {settingsNavItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/settings"
            ? pathname === "/settings"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/50 text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="truncate text-[11px] text-muted-foreground/70">{item.description}</p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
