"use client";

import { Button } from "@repo/web-ui/button";
import { Separator } from "@repo/web-ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Brand } from "./brand";
import { ResourceNav } from "./resource-nav";
import { UserMenu } from "./user-menu";

interface DesktopSidebarProps {
  collapsed: boolean;
  displayName: string;
  roles: string;
  permissions: string[];
  pathname: string;
  onCollapseChange: (collapsed: boolean) => void;
  onSignOut: () => void;
}

export function DesktopSidebar({
  collapsed,
  displayName,
  roles,
  permissions,
  pathname,
  onCollapseChange,
  onSignOut,
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 z-20 hidden h-dvh shrink-0 flex-col border-r border-border/40 bg-background/50 backdrop-blur-md transition-all duration-300 lg:flex",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      <div
        className={cn(
          "flex min-h-14 items-center border-b border-border/40",
          collapsed ? "justify-center px-0" : "justify-between px-4",
        )}
      >
        <Brand collapsed={collapsed} />
        {!collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapseChange(true)}
            aria-label="Collapse sidebar"
            className="size-7 text-muted-foreground/60 hover:text-foreground rounded-lg"
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}
      </div>

      <ResourceNav
        collapsed={collapsed}
        permissions={permissions}
        pathname={pathname}
      />

      {collapsed ? (
        <div className="flex justify-center border-t border-border/40 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapseChange(false)}
            aria-label="Expand sidebar"
            className="size-7 text-muted-foreground/60 hover:text-foreground rounded-lg"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}

      <Separator className="bg-border/40" />
      <UserMenu
        collapsed={collapsed}
        displayName={displayName}
        roles={roles}
        onSignOut={onSignOut}
      />
    </aside>
  );
}
