"use client";

import { Button } from "@repo/web-core/components/button";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { LoadingButton } from "@repo/web-core/components/loading-button";
import { RotateCcw } from "lucide-react";

import type { SettingRow } from "@/features/settings/controllers/settings-view-model";

import { displayValue } from "@/features/settings/model/settings-drafts";

import { SettingField } from "./setting-field";

export function SettingCard({ row }: { row: SettingRow }) {
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
