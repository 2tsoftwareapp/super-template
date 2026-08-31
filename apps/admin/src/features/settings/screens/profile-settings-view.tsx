"use client";

import { Avatar } from "@repo/web-ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Label } from "@repo/web-ui/label";

import { useAdminSession } from "@/components/admin-guard";
import { UserPreferences } from "@/features/security/ui/user-preferences";

export function ProfileSettingsView() {
  const { user } = useAdminSession();
  const displayName = user.displayName ?? "Admin User";
  const email = user.email ?? "admin@example.local";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information and how others see you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={displayName} size="lg" className="ring-2 ring-border/20" />
            <div>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="grid max-w-md gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <input
                id="displayName"
                type="text"
                defaultValue={displayName}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                defaultValue={email}
                disabled
                className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm opacity-60"
              />
              <p className="text-[11px] text-muted-foreground">
                Email is managed by your identity provider.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserPreferences />
    </div>
  );
}
