"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    permission: "projects.read",
  },
  { href: "/users", label: "Users", icon: Users, permission: "users.read" },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    permission: "notifications.read",
  },
  { href: "/settings/profile", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.isError) {
      router.replace("/login");
    }
  }, [router, session.isError]);

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <Card className="max-w-md text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-neutral-500">
            Loading workspace
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            Restoring your session
          </h1>
        </Card>
      </div>
    );
  }

  if (!session.data) {
    return null;
  }

  const allowedItems = navItems.filter(
    (item) =>
      !item.permission ||
      session.data.data.permissions.includes(item.permission),
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),transparent_28%),linear-gradient(180deg,#f4f1ea_0%,#ece7df_52%,#e6e0d7_100%)] px-4 py-4 text-neutral-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),transparent_24%),linear-gradient(180deg,#111111_0%,#171717_40%,#090909_100%)] dark:text-white md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[32px] border border-black/10 bg-white/75 p-5 backdrop-blur dark:border-white/10 dark:bg-neutral-950/75">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Super Template
              </p>
              <h1 className="mt-2 text-2xl font-semibold">Control Room</h1>
            </div>
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <div className="mt-8 space-y-2">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    pathname.startsWith(item.href)
                      ? "bg-neutral-950 text-white dark:bg-amber-300 dark:text-neutral-950"
                      : "text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-8 rounded-3xl bg-neutral-950 px-4 py-5 text-white dark:bg-white/10">
            <p className="text-sm font-medium">
              {session.data.data.user.displayName}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/60">
              {session.data.data.user.roles.join(" / ")}
            </p>
            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={async () => {
                await webFetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>
        <main className="rounded-[32px] border border-black/10 bg-white/65 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-950/70 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
