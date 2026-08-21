"use client";

import { Separator } from "@repo/web-ui/separator";

import { Brand } from "./brand";
import { ResourceNav } from "./resource-nav";
import { UserMenu } from "./user-menu";

interface MobileSidebarProps {
  displayName: string;
  roles: string;
  permissions: string[];
  pathname: string;
  onNavigate: () => void;
  onSignOut: () => void;
}

export function MobileSidebar({
  displayName,
  roles,
  permissions,
  pathname,
  onNavigate,
  onSignOut,
}: MobileSidebarProps) {
  return (
    <aside className="flex h-dvh flex-col bg-background/95 backdrop-blur-xl">
      <div className="flex min-h-14 items-center justify-between border-b border-border/60 px-4">
        <Brand />
      </div>
      <ResourceNav permissions={permissions} pathname={pathname} onNavigate={onNavigate} />
      <Separator className="bg-border/40" />
      <UserMenu displayName={displayName} roles={roles} onSignOut={onSignOut} />
    </aside>
  );
}
