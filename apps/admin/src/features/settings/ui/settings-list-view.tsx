"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { ConfirmDialog } from "@repo/web-core/components/confirm-dialog";
import { Input } from "@repo/web-core/components/input";
import { Spinner } from "@repo/web-core/components/spinner";
import { Search, X } from "lucide-react";

import type { SettingsViewModel } from "@/features/settings/controllers/settings-view-model";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/lib/admin-resources";

import { SettingCard } from "./setting-card";

const settingsResource = adminResources.find((r) => r.id === "settings")!;

/**
 * Presentational settings view. Receives a fully-resolved view model from the
 * settings controller and renders it; it owns no server state or draft
 * orchestration (see useSettingsController.getRow).
 */
export function SettingsListView({
  search,
  onSearchChange,
  isLoading,
  isRefreshing,
  onRefresh,
  totalCount,
  filtered,
  getRow,
  confirm,
}: SettingsViewModel) {
  return (
    <ResourcePageShell
      resource={settingsResource}
      description="View and update application settings."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription className="text-xs">
                {totalCount !== null
                  ? `${totalCount} settings`
                  : "Persisted settings returned by the API."}
              </CardDescription>
            </div>
            <div className="relative w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search settings…"
                className="h-8 pl-8 text-xs"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-5" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search ? "No settings match your search." : "No settings found."}
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((setting) => (
                <SettingCard key={setting.key} row={getRow(setting)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm.open}
        title="Save setting"
        message="Are you sure you want to update this setting? It will take effect immediately."
        confirmLabel="Save"
        loading={confirm.isSaving}
        onCancel={confirm.onCancel}
        onConfirm={confirm.onConfirm}
      />
    </ResourcePageShell>
  );
}
