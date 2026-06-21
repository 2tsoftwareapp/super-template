"use client";

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSession } from "@/hooks/use-session";
import {
  adminResourceGroups,
  adminResources,
  canAccessResource,
  getFirstAccessibleResourcePath,
  getResourceForPath,
  hasAdminAppAccess,
} from "@/lib/admin-resources";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dropdown, type DropdownItem } from "./ui/dropdown";
import { Separator } from "./ui/separator";
import { Spinner } from "./ui/spinner";
import { Tooltip } from "./ui/tooltip";

interface SidebarCtx {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  setCollapsed: () => undefined,
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("admin-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = (v: boolean) => {
    setCollapsed(v);
    try {
      localStorage.setItem("admin-sidebar-collapsed", String(v));
    } catch {
      return;
    }
  };

  useEffect(() => {
    if (session.isError) router.replace("/login");
  }, [router, session.isError]);

  const onSignOut = async () => {
    try {
      await webFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };

  const user = session.data?.data.user;
  const permissions = useMemo(
    () => session.data?.data.permissions ?? [],
    [session.data?.data.permissions],
  );
  const displayName = user?.displayName ?? "";
  const roles = user?.roles.join(" / ") ?? "";
  const currentResource = getResourceForPath(pathname);
  const canUseAdminApp = user
    ? hasAdminAppAccess({
        roles: user.roles,
        permissions,
      })
    : false;
  const canAccessCurrentRoute = user
    ? canAccessResource(currentResource, permissions)
    : false;

  useEffect(() => {
    if (!session.data) {
      return;
    }

    if (!canUseAdminApp) {
      void webFetch("/api/auth/logout", { method: "POST" }).finally(() =>
        router.replace("/login"),
      );
      return;
    }

    if (!canAccessCurrentRoute) {
      router.replace(getFirstAccessibleResourcePath(permissions));
    }
  }, [
    canAccessCurrentRoute,
    canUseAdminApp,
    pathname,
    permissions,
    router,
    session.data,
  ]);

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader className="items-center gap-3">
            <Spinner className="size-5" />
            <CardTitle>Restoring admin session</CardTitle>
            <CardDescription>
              Loading permissions and workspace state.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session.data || !user) return null;

  if (!canUseAdminApp || !canAccessCurrentRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader className="items-center gap-3">
            <Spinner className="size-5" />
            <CardTitle>Checking admin access</CardTitle>
            <CardDescription>
              Redirecting to a permitted workspace.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed: toggleCollapsed }}
    >
      <div className="flex min-h-dvh bg-muted/30">
        <DesktopSidebar
          collapsed={collapsed}
          displayName={displayName}
          roles={roles}
          permissions={permissions}
          pathname={pathname}
          onCollapseChange={toggleCollapsed}
          onSignOut={onSignOut}
        />

        {mobileMenuOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-foreground/35 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[280px] border-r border-border bg-card transition-transform lg:hidden",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <MobileSidebar
            displayName={displayName}
            roles={roles}
            permissions={permissions}
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
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div
      className={cn("flex items-center gap-2.5", collapsed && "justify-center")}
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
        <Zap className="size-4 text-background" />
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            Super Admin
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Resource console
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ResourceNav({
  collapsed,
  permissions,
  pathname,
  onNavigate,
}: {
  collapsed?: boolean;
  permissions: string[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      {adminResourceGroups.map((group) => {
        const resources = adminResources.filter(
          (resource) =>
            resource.group === group &&
            canAccessResource(resource, permissions),
        );
        if (resources.length === 0) return null;

        return (
          <div key={group} className={cn("mb-4", collapsed && "mb-2")}>
            {!collapsed ? (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                {group}
              </p>
            ) : null}
            <div className="flex flex-col gap-1">
              {resources.map((resource) => {
                const Icon = resource.icon;
                const isActive =
                  resource.path === "/"
                    ? pathname === "/"
                    : pathname === resource.path ||
                      pathname.startsWith(`${resource.path}/`);
                const link = (
                  <Link
                    key={resource.path}
                    href={resource.path}
                    {...(onNavigate ? { onClick: onNavigate } : {})}
                    className={cn(
                      "flex min-h-10 items-center rounded-md px-2 text-sm transition-colors",
                      collapsed ? "justify-center" : "gap-3",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="shrink-0" />
                    {!collapsed ? (
                      <span className="truncate">{resource.label}</span>
                    ) : null}
                  </Link>
                );

                return collapsed ? (
                  <Tooltip
                    key={resource.path}
                    content={resource.label}
                    side="right"
                  >
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

function DesktopSidebar({
  collapsed,
  displayName,
  roles,
  permissions,
  pathname,
  onCollapseChange,
  onSignOut,
}: {
  collapsed: boolean;
  displayName: string;
  roles: string;
  permissions: string[];
  pathname: string;
  onCollapseChange: (collapsed: boolean) => void;
  onSignOut: () => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 z-20 hidden h-dvh shrink-0 flex-col border-r border-border bg-card transition-all duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-[272px]",
      )}
    >
      <div
        className={cn(
          "flex min-h-14 items-center border-b border-border",
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
          >
            <ChevronLeft />
          </Button>
        ) : null}
      </div>

      <ResourceNav
        collapsed={collapsed}
        permissions={permissions}
        pathname={pathname}
      />

      {collapsed ? (
        <div className="flex justify-center border-t border-border py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapseChange(false)}
            aria-label="Expand sidebar"
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}

      <Separator />
      <UserMenu
        collapsed={collapsed}
        displayName={displayName}
        roles={roles}
        onSignOut={onSignOut}
      />
    </aside>
  );
}

function MobileSidebar({
  displayName,
  roles,
  permissions,
  pathname,
  onNavigate,
  onSignOut,
}: {
  displayName: string;
  roles: string;
  permissions: string[];
  pathname: string;
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  return (
    <aside className="flex h-dvh flex-col bg-card">
      <div className="flex min-h-14 items-center justify-between border-b border-border px-4">
        <Brand />
      </div>
      <ResourceNav
        permissions={permissions}
        pathname={pathname}
        onNavigate={onNavigate}
      />
      <Separator />
      <UserMenu displayName={displayName} roles={roles} onSignOut={onSignOut} />
    </aside>
  );
}

function UserMenu({
  collapsed,
  displayName,
  roles,
  onSignOut,
}: {
  collapsed?: boolean;
  displayName: string;
  roles: string;
  onSignOut: () => void;
}) {
  return (
    <div className={cn("p-2", collapsed && "flex justify-center")}>
      <Dropdown
        align="start"
        trigger={
          collapsed ? (
            <Tooltip content={displayName} side="right">
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-muted"
                aria-label={displayName}
              >
                <Avatar name={displayName} size="sm" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-left transition-colors hover:bg-muted"
            >
              <Avatar name={displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {roles}
                </p>
              </div>
            </button>
          )
        }
        items={[
          {
            label: displayName,
            icon: <Avatar name={displayName} size="sm" />,
          } satisfies DropdownItem,
          { separator: true } satisfies DropdownItem,
          {
            label: "Sign out",
            icon: <LogOut />,
            onClick: () => void onSignOut(),
            destructive: true,
          } satisfies DropdownItem,
        ]}
      />
    </div>
  );
}

function TopHeader({
  displayName,
  onSignOut,
  onOpenMobileMenu,
}: {
  displayName: string;
  onSignOut: () => void;
  onOpenMobileMenu: () => void;
}) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-border bg-card px-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation"
          className="lg:hidden"
        >
          <Menu />
        </Button>
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="hidden lg:inline-flex"
          >
            <ChevronRight />
          </Button>
        ) : null}
        <PageTitle />
      </div>

      <div className="flex items-center gap-1">
        <Dropdown
          align="end"
          trigger={
            <Button variant="ghost" size="icon" aria-label="Dashboard actions">
              <BarChart3 />
            </Button>
          }
          items={[
            {
              label: "View dashboard",
              icon: <BarChart3 />,
            } satisfies DropdownItem,
          ]}
        />
        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="ml-1 flex size-9 items-center justify-center rounded-full transition-colors hover:ring-2 hover:ring-border"
              aria-label={displayName}
            >
              <Avatar name={displayName} size="sm" />
            </button>
          }
          items={[
            {
              label: displayName,
              icon: <Avatar name={displayName} size="sm" />,
            } satisfies DropdownItem,
            { separator: true } satisfies DropdownItem,
            {
              label: "Settings",
              icon: <Settings />,
            } satisfies DropdownItem,
            { separator: true } satisfies DropdownItem,
            {
              label: "Sign out",
              icon: <LogOut />,
              onClick: onSignOut,
              destructive: true,
            } satisfies DropdownItem,
          ]}
        />
      </div>
    </header>
  );
}

function PageTitle() {
  const pathname = usePathname();
  const matched = getResourceForPath(pathname);
  const Icon = matched.icon;

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
      <Icon className="shrink-0 text-muted-foreground" />
      <span className="truncate">{matched.label}</span>
    </div>
  );
}
