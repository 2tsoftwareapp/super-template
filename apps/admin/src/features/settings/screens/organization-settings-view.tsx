"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Label } from "@repo/web-ui/label";
import { Building, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";

export function OrganizationSettingsView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="size-4" />
            Organization
          </CardTitle>
          <CardDescription>Manage your organization profile and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid max-w-md gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization name</Label>
              <input
                id="orgName"
                type="text"
                defaultValue="My Organization"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug">Slug</Label>
              <input
                id="orgSlug"
                type="text"
                defaultValue="my-organization"
                disabled
                className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm opacity-60"
              />
              <p className="text-[11px] text-muted-foreground">
                The slug is used in URLs and cannot be changed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Team Members
          </CardTitle>
          <CardDescription>Manage who has access to this organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Visit the{" "}
            <Link href="/organizations" className="text-primary underline underline-offset-4">
              Organizations
            </Link>{" "}
            page to manage members and roles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
