"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent } from "@repo/web-ui/card";
import { Empty } from "@repo/web-ui/empty";
import { Input } from "@repo/web-ui/input";
import { SectionLoading } from "@repo/web-ui/loading";
import { Show } from "@repo/web-ui/show";
import { Building, Plus, Search, X } from "lucide-react";
import { useState } from "react";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/lib/admin-resources";
import { Link, useRouter } from "@/i18n/navigation";
import { useOrganizationsQuery } from "../api/organizations.queries";
import { CreateOrganizationDrawer } from "../ui/create-organization-drawer";

const organizationsResource = adminResources.find((r) => r.id === "organizations")!;

export function OrganizationsView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useOrganizationsQuery();
  const orgs = data?.data ?? [];

  const filteredOrgs = orgs.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.slug.toLowerCase().includes(search.toLowerCase())
  );

  const noResults = search && filteredOrgs.length === 0;
  const noOrgs = !search && filteredOrgs.length === 0;

  return (
    <>
      <CreateOrganizationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ResourcePageShell
        resource={organizationsResource}
        description="View and manage workspaces, tenants, and membership directories."
        isRefreshing={isFetching}
        onRefresh={() => void refetch()}
        actions={
          <Button size="sm" onClick={() => setDrawerOpen(true)}>
            <Plus data-icon="inline-start" />
            New Organization
          </Button>
        }
      >
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search organizations or slugs..."
                  className="h-9 pl-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {search && (
                <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                  <X className="size-4" />
                </Button>
              )}
            </div>

            <Show when={isLoading}>
              <div className="p-8">
                <SectionLoading />
              </div>
            </Show>

            {!isLoading && noResults ? (
              <Empty
                title="No organizations match your search"
                description="Try using different keywords or slugs."
              />
            ) : !isLoading && noOrgs ? (
              <Empty
                title="No organizations yet"
                description="Create a new organization to start setting up workspace tenants."
              />
            ) : !isLoading ? (
              <div className="divide-y divide-border">
                {filteredOrgs.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => router.push(`/organizations/${org.id}`)}
                    className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                        <Building className="size-4.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">
                            {org.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono bg-muted/65 px-1.5 py-0.5 rounded border border-border">
                            {org.slug}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground bg-secondary border border-border/80 px-2 py-0.5 rounded-full font-medium">
                        View Workspace
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </ResourcePageShell>
    </>
  );
}
