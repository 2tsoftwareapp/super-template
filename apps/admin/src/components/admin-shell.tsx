import { createContext, useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Settings,
  Shield,
  Table2,
  Ticket,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { Avatar } from "./ui/avatar";
import { Dropdown, type DropdownItem } from "./ui/dropdown";
import { Tooltip } from "./ui/tooltip";
import { Spinner } from "./ui/spinner";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { clearStoredAuthTokens } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

// ── Sidebar context ──────────────────────────────────────────────────────────

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

// ── Nav structure ────────────────────────────────────────────────────────────

const navGroups = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/roles", label: "Roles", icon: Table2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/audit-logs", label: "Audit logs", icon: Shield },
      { href: "/notifications", label: "Notifications", icon: Megaphone },
      { href: "/jobs", label: "Jobs", icon: Workflow },
      { href: "/mail", label: "Mail", icon: Mail },
      { href: "/imports", label: "Imports", icon: Ticket },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

// ── Shell ────────────────────────────────────────────────────────────────────

export function AdminShell() {
  const session = useSession();
  const navigate = useNavigate();
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
    if (session.isError) void navigate("/login", { replace: true });
  }, [navigate, session.isError]);

  const onSignOut = async () => {
    try {
      await webFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      clearStoredAuthTokens();
    }
    await navigate("/login", { replace: true });
  };

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <CardHeader className="items-center gap-3">
            <Spinner className="size-5" />
            <CardTitle>Restoring admin session</CardTitle>
            <CardDescription>Loading permissions and workspace state.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session.data) return null;

  const user = session.data.data.user;
  const displayName = user.displayName;
  const roles = user.roles.join(" / ");

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed: toggleCollapsed }}>
      <div className="flex min-h-screen bg-muted/30">
        {/* ── Sidebar ── */}
        <aside
          className={cn(
            "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card transition-all duration-200",
            collapsed ? "w-[64px]" : "w-[260px]",
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center border-b border-border",
              collapsed ? "h-14 justify-center px-0" : "h-14 justify-between px-4",
            )}
          >
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-foreground">
                  <Zap className="size-3.5 text-background" />
                </div>
                <span className="text-sm font-semibold tracking-tight">Super Admin</span>
              </div>
            )}
            {collapsed && (
              <div className="flex size-7 items-center justify-center rounded-lg bg-foreground">
                <Zap className="size-3.5 text-background" />
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={() => toggleCollapsed(true)}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {navGroups.map((group) => (
              <div key={group.label} className={cn("mb-4", collapsed && "mb-2")}>
                {!collapsed && (
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const link = (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === "/"}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center rounded-lg px-2 py-2 text-sm transition-colors",
                            collapsed ? "justify-center" : "gap-3",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )
                        }
                      >
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    );
                    return collapsed ? (
                      <Tooltip key={item.href} content={item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Expand button when collapsed */}
          {collapsed && (
            <div className="flex justify-center border-t border-border py-2">
              <button
                type="button"
                onClick={() => toggleCollapsed(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          {/* User section */}
          <Separator />
          <div className={cn("p-2", collapsed && "flex justify-center")}>
            <Dropdown
              align="start"
              trigger={
                collapsed ? (
                  <Tooltip content={displayName} side="right">
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                    >
                      <Avatar name={displayName} size="sm" />
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <Avatar name={displayName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{roles}</p>
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
                  icon: <LogOut className="size-4" />,
                  onClick: () => void onSignOut(),
                  destructive: true,
                } satisfies DropdownItem,
              ]}
            />
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader displayName={displayName} onSignOut={onSignOut} />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

// ── Top Header ───────────────────────────────────────────────────────────────

function TopHeader({
  displayName,
  onSignOut,
}: {
  displayName: string;
  onSignOut: () => void;
}) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="size-4" />
          </button>
        )}
        <PageTitle />
      </div>

      <div className="flex items-center gap-1">
        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <BarChart3 className="size-4" />
            </button>
          }
          items={[
            { label: "View dashboard", icon: <LayoutDashboard className="size-4" /> } satisfies DropdownItem,
          ]}
        />
        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="ml-1 flex size-8 items-center justify-center rounded-full transition-colors hover:ring-2 hover:ring-border"
              aria-label={displayName}
            >
              <Avatar name={displayName} size="sm" />
            </button>
          }
          items={[
            { label: displayName, icon: <Avatar name={displayName} size="sm" /> } satisfies DropdownItem,
            { separator: true } satisfies DropdownItem,
            {
              label: "Settings",
              icon: <Settings className="size-4" />,
            } satisfies DropdownItem,
            { separator: true } satisfies DropdownItem,
            {
              label: "Sign out",
              icon: <LogOut className="size-4" />,
              onClick: onSignOut,
              destructive: true,
            } satisfies DropdownItem,
          ]}
        />
      </div>
    </header>
  );
}

// ── Page title from location ─────────────────────────────────────────────────

function PageTitle() {
  const allItems = navGroups.flatMap((g) => g.items);

  // Derive title from pathname without useLocation side effects
  const pathname = window.location.pathname;
  const matched =
    allItems.find((item) => {
      if (item.href === "/") return pathname === "/";
      return pathname === item.href || pathname.startsWith(item.href + "/");
    }) ?? allItems[0];

  if (!matched) return null;

  const Icon = matched.icon;
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Icon className="size-4 text-muted-foreground" />
      <span>{matched.label}</span>
    </div>
  );
}
