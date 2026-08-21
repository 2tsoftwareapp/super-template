"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { RefreshCcw, Settings } from "lucide-react";

import type { SettingsViewModel } from "@/features/settings/model/settings.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { adminResources } from "@/lib/admin-resources";

import { ResourceEmpty } from "@/components/resource-empty";

import { SettingCard } from "./setting-card";

const settingsResource = adminResources.find((r) => r.id === "settings")!;

/**
 * Presentational settings view. Receives a fully-resolved view model from the
 * settings controller and renders it; it owns no server state or draft
 * orchestration (per-card RHF forms own their draft state).
 */
export function SettingsListView({
  search,
  onSearchChange,
  isLoading,
  isRefreshing,
  isError,
  onRetry,
  onRefresh,
  totalCount,
  filtered,
  canUpdate,
  onSave,
  isSavingKey,
}: SettingsViewModel) {
  return (
    <ResourcePageShell
      resource={settingsResource}
      description="View and update application settings."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      actions={
        isError ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCcw data-icon="inline-start" />
            Retry
          </Button>
        ) : null
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <div>
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription className="text-xs">
              {totalCount !== null
                ? `${totalCount} settings`
                : "Persisted settings returned by the API."}
            </CardDescription>
          </div>
        </CardHeader>
        <ResourceToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search settings…"
          hasFilters={Boolean(search)}
          onClearFilters={() => onSearchChange("")}
        />
        <CardContent className="pb-4">
          {isLoading ? (
            <SectionLoading />
          ) : isError ? (
            <ErrorState
              variant="inline"
              title="Could not load settings."
              action={{ label: "Retry", onClick: onRetry }}
            />
          ) : filtered.length === 0 ? (
            <ResourceEmpty
              icon={Settings}
              title={search ? "No settings match your search." : "No settings found."}
              description={search ? "Try different keywords or clear your search." : "No configuration settings returned by the API."}
              isFiltered={Boolean(search)}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((setting) => (
                <SettingCard
                  key={setting.key}
                  setting={setting}
                  canUpdate={canUpdate}
                  isSaving={isSavingKey === setting.key}
                  onSave={onSave}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ResourcePageShell>
  );
}
