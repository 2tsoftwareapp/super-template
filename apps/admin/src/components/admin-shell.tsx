"use client";

import { useAdminSession } from "@/components/admin-guard";
import { TopHeader } from "@/components/admin-shell/top-header";
import { CommandMenu } from "@/components/command-menu";
import { SidebarNav } from "@/components/sidebar-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import { Brand } from "./admin-shell/brand";
import { UserMenu } from "./admin-shell/user-menu";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, permissions } = useAdminSession();
  const displayName = user.displayName ?? "Admin User";
  const roles = user.roles?.join(", ") ?? "Operator";

  const onSignOut = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <CommandMenu permissions={permissions} />

      <Sidebar collapsible="icon" className="border-r border-border/40">
        <SidebarHeader>
          <Brand />
        </SidebarHeader>

        <SidebarContent>
          <SidebarNav permissions={permissions} />
        </SidebarContent>

        <SidebarSeparator />
        <SidebarFooter>
          <UserMenu displayName={displayName} roles={roles} onSignOut={onSignOut} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <TopHeader displayName={displayName} onSignOut={onSignOut} />
        <main className="flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
