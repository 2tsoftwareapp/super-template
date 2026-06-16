"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/hooks/use-session";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { clientNavItems } from "@/lib/navigation";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  useNotificationStream(Boolean(session.data));

  useEffect(() => {
    if (session.isError) {
      router.replace("/login");
    }
  }, [router, session.isError]);

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md border-border bg-card text-center">
          <CardHeader className="items-center">
            <Spinner className="size-5 text-primary" />
            <CardTitle className="text-2xl">Restoring your session</CardTitle>
            <CardDescription>
              Loading workspace state and permissions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session.data) {
    return null;
  }

  const allowedClientItems = clientNavItems.filter(
    (item) =>
      !item.permission ||
      session.data.data.permissions.includes(item.permission),
  );

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <Card className="h-full border-border bg-card ">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="w-fit">
                    Client workspace
                  </Badge>
                  <CardTitle className="text-2xl">Super Template</CardTitle>
                  <CardDescription>
                    The Next.js app is reserved for client-facing work.
                  </CardDescription>
                </div>
                <Shield className="size-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="flex h-full flex-col gap-4">
              <Separator />
              <nav className="space-y-1">
                {allowedClientItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                        pathname.startsWith(item.href)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <Separator />
              <div className="mt-auto rounded-2xl border border-border bg-muted/50 p-4">
                <p className="text-sm font-medium">
                  {session.data.data.user.displayName}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {session.data.data.user.roles.join(" / ")}
                </p>
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={async () => {
                    await webFetch("/api/auth/logout", { method: "POST" });
                    router.replace("/login");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
        <main className="min-w-0">
          <Card className="min-h-full border-border bg-card ">
            <CardContent className="p-4 md:p-6">{children}</CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
