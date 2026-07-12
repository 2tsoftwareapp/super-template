"use client";

import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { ConfirmDialog } from "@repo/web-core/components/confirm-dialog";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { LoadingButton } from "@repo/web-core/components/loading-button";
import { Spinner } from "@repo/web-core/components/spinner";
import { RotateCcw, Search, X } from "lucide-react";

import type {
  SettingRow,
  SettingsViewModel,
} from "@/features/settings/use-settings-controller";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { displayValue } from "@/features/settings/settings-drafts";
import { adminResources } from "@/lib/admin-resources";

import { SettingField } from "./setting-field";

const settingsResource = adminResources.find((r) => r.id === "settings")!;

function SettingCard({ row }: { row: SettingRow }) {
  const { setting, isObject, hasChanges, isSaving, scalar, object } = row;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {setting.key}
          </code>
          {isObject ? (
            <pre className="mt-1 max-h-20 overflow-auto rounded bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
              {displayValue(setting.value)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              {displayValue(setting.value)}
            </p>
          )}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 md:max-w-xs">
          <Label htmlFor={`setting-${setting.key}`} className="text-xs">
            Override value
          </Label>

          {object ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              {object.fields.map((field) => (
                <SettingField
                  key={field.key}
                  label={field.key}
                  value={field.value}
                  onChange={field.onChange}
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5">
              <Input
                id={`setting-${setting.key}`}
                value={scalar.value}
                onChange={(e) => scalar.onChange(e.target.value)}
              />
              {hasChanges && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={scalar.onReset}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}
            </div>
          )}

          {hasChanges && (
            <div className="flex gap-1.5">
              <LoadingButton
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={row.onRequestSave}
                loading={isSaving}
              >
                Save
              </LoadingButton>
              {isObject && object && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={object.onReset}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
