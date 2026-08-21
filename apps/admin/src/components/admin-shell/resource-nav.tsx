"use client";

import { Tooltip } from "@repo/web-ui/tooltip";

import { Link } from "@/i18n/navigation";
import { adminResourceGroups, adminResources, canAccessResource } from "@/lib/admin-resources";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ResourceNavProps {
  collapsed?: boolean;
  permissions: string[];
  pathname: string;
  onNavigate?: () => void;
}

export function ResourceNav({ collapsed, permissions, pathname, onNavigate }: ResourceNavProps) {
  const { t } = useI18n();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {adminResourceGroups.map((group) => {
        const resources = adminResources.filter(
          (resource) => resource.group === group && canAccessResource(resource, permissions),
        );
        if (resources.length === 0) return null;

        return (
          <div key={group} className="space-y-1">
            {!collapsed ? (
              <p className="px-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                {t(`nav.groups.${group}`)}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {resources.map((resource) => {
                const Icon = resource.icon;
                const isActive =
                  resource.path === "/"
                    ? pathname === "/"
                    : pathname === resource.path || pathname.startsWith(`${resource.path}/`);
                const link = (
                  <Link
                    key={resource.path}
                    href={resource.path}
                    {...(onNavigate ? { onClick: onNavigate } : {})}
                    className={cn(
                      "group flex min-h-9 items-center rounded-lg px-2.5 text-[13px] font-medium transition-all duration-200 relative",
                      collapsed ? "justify-center" : "gap-3",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-[inset_1px_1px_0px_rgba(255,255,255,0.05)] after:absolute after:left-0 after:top-1.5 after:bottom-1.5 after:w-[3px] after:rounded-r-full after:bg-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform group-hover:scale-105",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {!collapsed ? (
                      <span className="truncate">{t(`nav.${resource.id}`)}</span>
                    ) : null}
                  </Link>
                );

                return collapsed ? (
                  <Tooltip key={resource.path} content={t(`nav.${resource.id}`)} side="right">
                    {link}
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
