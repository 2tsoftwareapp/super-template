"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent } from "@repo/web-ui/card";
import { Empty } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { Show } from "@repo/web-ui/show";
import { Building, Plus, RefreshCcw } from "lucide-react";

import type { OrganizationsListViewModel } from "@/features/organizations/model/organizations.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { adminResources } from "@/features/_plugin-resources/admin-resources";

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

  return (
    <>
      <CreateOrganizationDrawer
        open={drawer.open}
        onClose={drawer.onClose}
        onSubmit={drawer.onCreate}
        isSubmitting={drawer.isCreating}
      />

      <ResourcePageShell
        resource={organizationsResource}
        description="View and manage workspaces, tenants, and membership directories."
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        actions={
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
      >
        <Card>
          <CardContent className="p-0">
            <ResourceToolbar
              search={search}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search organizations or slugs..."
              hasFilters={Boolean(search)}
              onClearFilters={() => onSearchChange("")}
            />

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
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => onNavigate(org.id)}
                    className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                        <Building className="size-4.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{org.name}</span>
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
