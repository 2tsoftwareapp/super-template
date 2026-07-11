"use client";

import { safeLocalStorage } from "@repo/web-core";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/hooks/use-session";
import {
  canAccessResource,
  getFirstAccessibleResourcePath,
  getResourceForPath,
  hasAdminAppAccess,
} from "@/lib/admin-resources";
import { cn } from "@/lib/utils";

import {
  DesktopSidebar,
  MobileSidebar,
  SidebarContext,
  TopHeader,
} from "./admin-shell/index";
import { FullScreenLoading } from "./ui/loading";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    return (
      safeLocalStorage.getItem<boolean>("admin-sidebar-collapsed") ?? false
    );
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleCollapsed = (val: boolean) => {
    setCollapsed(val);
    safeLocalStorage.setItem("admin-sidebar-collapsed", val);
  };

  const user = session.data?.data.user;
  const permissions = session.data?.data.permissions;
  const canUseAdminApp = hasAdminAppAccess({
    roles: user?.roles ?? [],
    permissions: permissions ?? [],
  });

  const matchedResource = getResourceForPath(pathname);
  const canAccessCurrentRoute = canAccessResource(
    matchedResource,
    permissions ?? [],
  );

  useEffect(() => {
    if (!session.isLoading && !session.data) {
      router.replace("/login");
      return;
    }
    if (!session.isLoading && session.data) {
      if (!canUseAdminApp) {
        router.replace("/");
        return;
      }
      if (!canAccessCurrentRoute) {
        const fallback = getFirstAccessibleResourcePath(permissions ?? []);
        router.replace(fallback);
      }
    }
  }, [
    session.isLoading,
    session.data,
    canUseAdminApp,
    canAccessCurrentRoute,
    permissions,
    router,
  ]);

  if (session.isLoading) {
    return (
      <FullScreenLoading
        title="Restoring admin session"
        description="Loading permissions and workspace state."
      />
    );
  }

  if (!session.data || !user) return null;

  if (!canUseAdminApp || !canAccessCurrentRoute) {
    return (
      <FullScreenLoading
        title="Checking admin access"
        description="Redirecting to a permitted workspace."
      />
    );
  }

  const displayName = user.displayName ?? "Admin User";
  const roles = user.roles?.join(", ") ?? "Operator";

  const onSignOut = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed: toggleCollapsed }}
    >
      <div className="relative flex min-h-screen w-full bg-background overflow-hidden">
        {/* Ambient Decorative Backdrops */}
        <div className="absolute top-0 right-0 -z-10 size-[450px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-10 size-[450px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

        <DesktopSidebar
          collapsed={collapsed}
          displayName={displayName}
          roles={roles}
          permissions={permissions ?? []}
          pathname={pathname}
          onCollapseChange={toggleCollapsed}
          onSignOut={onSignOut}
        />

        {mobileMenuOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[272px] border-r border-border/40 bg-background/95 backdrop-blur-md transition-transform duration-300 lg:hidden",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <MobileSidebar
            displayName={displayName}
            roles={roles}
            permissions={permissions ?? []}
            pathname={pathname}
            onNavigate={() => setMobileMenuOpen(false)}
            onSignOut={onSignOut}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader
            displayName={displayName}
            onSignOut={onSignOut}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          <main className="flex-1 p-4 md:p-6 min-h-0 overflow-y-auto animate-in fade-in slide-in-from-bottom-1 duration-200">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
