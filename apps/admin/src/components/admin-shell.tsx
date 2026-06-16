import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
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
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { Spinner } from "./ui/spinner";
import { clearStoredAuthTokens } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

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

export function AdminShell() {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.isError) {
      void navigate("/login", { replace: true });
    }
  }, [navigate, session.isError]);

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="items-center">
            <Spinner className="size-5" />
            <CardTitle className="text-2xl">Restoring admin session</CardTitle>
            <CardDescription>Loading permissions and workspace state.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session.data) {
    return null;
  }

  const onSignOut = async () => {
    try {
      await webFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      clearStoredAuthTokens();
    }
    await navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[296px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex h-full flex-col rounded-3xl border border-border bg-card shadow-sm">
            <div className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="w-fit">
                    Admin app
                  </Badge>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-semibold leading-tight">
                      Super Template Admin
                    </h1>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Separate management workspace for people, projects, and
                      platform controls.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-2">
                  <BarChart3 className="size-5 text-primary" />
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Signed in as
                </p>
                <p className="mt-2 text-sm font-medium">
                  {session.data.data.user.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.data.data.user.roles.join(" / ")}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex min-h-0 flex-1 flex-col gap-5 px-3 py-4">
              <nav className="space-y-5">
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )
                            }
                            end={item.href === "/"}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="mt-auto px-2 pb-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => void onSignOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </aside>
        <main className="min-w-0">
          <div className="min-h-full rounded-3xl border border-border bg-card p-4 shadow-sm md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
