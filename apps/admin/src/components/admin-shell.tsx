import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, LayoutDashboard, LogOut, Settings, Users, FolderKanban } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Spinner } from "./ui/spinner";
import { useSession } from "@/lib/session";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
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
    await webFetch("/api/auth/logout", { method: "POST" });
    await navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <Card className="h-full">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="w-fit">
                    Admin app
                  </Badge>
                  <CardTitle className="text-2xl">Super Template Admin</CardTitle>
                  <CardDescription>
                    A separate React + Vite workspace for management tasks.
                  </CardDescription>
                </div>
                <BarChart3 className="size-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="flex h-full flex-col gap-4">
              <Separator />
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
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
              </nav>
              <Separator />
              <div className="mt-auto rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-sm font-medium">
                  {session.data.data.user.displayName}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {session.data.data.user.roles.join(" / ")}
                </p>
                <Button className="mt-4 w-full" variant="outline" onClick={() => void onSignOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
        <main className="min-w-0">
          <Card className="min-h-full">
            <CardContent className="p-4 md:p-6">
              <Outlet />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
