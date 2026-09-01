"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import { Empty } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { Show } from "@repo/web-ui/show";
import { Building, ChevronRight, Crown, Plus, RefreshCcw, Shield, Users } from "lucide-react";

import type { OrganizationsListViewModel } from "@/features/organizations/model/organizations.types";

import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { timeAgo } from "@/lib/format";

import { CreateOrganizationDrawer } from "./create-organization-drawer";

const organizationsResource = adminResources.find((r) => r.id === "organizations")!;

/**
 * Presentational organizations list. Receives a fully-resolved view model from
 * the list controller and renders it without server state or mutations.
 */
export function OrganizationsListView(vm: OrganizationsListViewModel) {
  const {
    search,
    onSearchChange,
    organizations,
    isLoading,
    isRefreshing,
    isError,
    onRetry,
    onRefresh,
    noResults,
    noOrgs,
    onNavigate,
    drawer,
  } = vm;

  const totalOrgs = organizations.length;
  const ownerCount = organizations.filter((o) => o.role === "OWNER").length;
  const adminCount = organizations.filter((o) => o.role === "ADMIN").length;
  const memberCount = organizations.filter((o) => o.role === "MEMBER").length;

  return (
    <>
      <CreateOrganizationDrawer
        open={drawer.open}
        onClose={drawer.onClose}
        onSubmit={drawer.onCreate}
        isSubmitting={drawer.isCreating}
      />

      <CommonResourcePage
        resource={organizationsResource}
        description="View and manage workspaces, tenants, and membership directories."
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        statsLoading={isLoading}
        statsColumns={4}
        stats={[
          {
            label: "Total Organizations",
            value: totalOrgs,
            icon: Building,
            description: "Registered workspace tenants",
          },
          {
            label: "Owned Workspaces",
            value: ownerCount,
            icon: Crown,
            description: "Workspaces you own",
          },
          {
            label: "Admin Workspaces",
            value: adminCount,
            icon: Shield,
            description: "Workspaces you administer",
          },
          {
            label: "Member Workspaces",
            value: memberCount,
            icon: Users,
            description: "General team memberships",
          },
        ]}
        headerActions={
          <>
            {isError ? (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCcw data-icon="inline-start" />
                Retry
              </Button>
            ) : null}
            <Button size="sm" onClick={drawer.onOpen}>
              <Plus data-icon="inline-start" />
              New Organization
            </Button>
          </>
        }
        filterBar={
          <ResourceFilterBar
            className="border-b border-border p-4"
            search={{
              value: search,
              onChange: onSearchChange,
              placeholder: "Search organizations or slugs...",
            }}
            onClearAll={search ? () => onSearchChange("") : undefined}
          />
        }
      >
        <Show when={isLoading}>
          <div className="p-8">
            <SectionLoading />
          </div>
        </Show>

        {!isLoading && isError ? (
          <ErrorState
            variant="inline"
            className="m-4"
            title="Could not load organizations."
            action={{ label: "Retry", onClick: onRetry }}
          />
        ) : null}

        {!isLoading && !isError && noResults ? (
          <Empty
            title="No organizations match your search"
            description="Try using different keywords or slugs."
          />
        ) : null}

        {!isLoading && !isError && noOrgs ? (
          <Empty
            title="No organizations yet"
            description="Create a new organization to start setting up workspace tenants."
          />
        ) : null}

        {!isLoading && !isError && !noResults && !noOrgs ? (
          <div className="divide-y divide-border">
            {organizations.map((org) => {
              const isOwner = org.role === "OWNER";
              const isAdmin = org.role === "ADMIN";
              return (
                <div
                  key={org.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate(org.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onNavigate(org.id);
                    }
                  }}
                  className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-muted/30 focus-visible:outline-hidden focus-visible:bg-muted/40"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                      <Building className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{org.name}</span>
                        {org.role ? (
                          <Badge
                            variant={isOwner ? "default" : isAdmin ? "secondary" : "outline"}
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {org.role.toLowerCase()}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono bg-muted/65 px-1.5 py-0.2 rounded border border-border text-[11px]">
                          {org.slug}
                        </span>
                        <span>·</span>
                        <span>Created {timeAgo(org.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground bg-secondary border border-border/80 px-2.5 py-1 rounded-md font-medium inline-flex items-center gap-1">
                      View Workspace
                      <ChevronRight className="size-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CommonResourcePage>
    </>
  );
}
