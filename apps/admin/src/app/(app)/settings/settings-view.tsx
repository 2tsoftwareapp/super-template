"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { ApplicationSettingDto, ListResponse } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { adminResources } from "@/lib/admin-resources";
import { parseJsonValue } from "@/lib/json";
import { webFetch } from "@/lib/http";

function displayValue(value: ApplicationSettingDto["value"]): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function initDraft(value: ApplicationSettingDto["value"]): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

const settingsResource = adminResources.find((r) => r.id === "settings")!;

function SettingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | boolean | number | null;
  onChange: (val: string | boolean) => void;
}) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={value}
          onChange={() => onChange(!value)}
        />
        <span className="text-sm">{label}</span>
      </label>
    );
  }
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground font-mono">{label}</Label>
      <Input
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={value === null ? "null" : `Value for ${label}`}
      />
    </div>
  );
}

export function SettingsView() {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () =>
      webFetch<ListResponse<ApplicationSettingDto>>("/api/bff/admin/settings"),
  });

  const [search, setSearch] = useState("");
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [draftObjectValues, setDraftObjectValues] = useState<
    Record<string, Record<string, string | boolean>>
  >({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return settings.data?.data ?? [];
    const q = search.toLowerCase();
    return (settings.data?.data ?? []).filter((s) =>
      s.key.toLowerCase().includes(q),
    );
  }, [settings.data?.data, search]);

  const updateSetting = useMutation({
    mutationFn: ({
      key,
      value,
    }: {
      key: string;
      value: ApplicationSettingDto["value"];
    }) =>
      webFetch<{ data: ApplicationSettingDto }>(
        `/api/bff/admin/settings/${key}`,
        {
          method: "PATCH",
          body: JSON.stringify({ value }),
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setDraftValues((prev) => {
        const next = { ...prev };
        delete next[savingKey!];
        return next;
      });
      setDraftObjectValues((prev) => {
        const next = { ...prev };
        delete next[savingKey!];
        return next;
      });
      setSavingKey(null);
      toast.success("Setting saved");
    },
    onError: () => {
      setSavingKey(null);
      toast.error("Failed to save setting");
    },
  });

  const handleSave = () => {
    if (!savingKey) return;
    const setting = settings.data?.data.find((s) => s.key === savingKey);
    const isObject =
      setting && typeof setting.value === "object" && setting.value !== null;

    let next: ApplicationSettingDto["value"];
    if (isObject && draftObjectValues[savingKey]) {
      next = draftObjectValues[savingKey] as unknown as ApplicationSettingDto["value"];
    } else {
      const raw = draftValues[savingKey] ?? initDraft(setting?.value ?? null as never);
      next = parseJsonValue(raw) as ApplicationSettingDto["value"];
    }

    updateSetting.mutate({ key: savingKey, value: next });
    setConfirmOpen(false);
  };

  const hasObjectDraft = (key: string) =>
    draftObjectValues[key] !== undefined;

  const objectDraftChanged = (key: string, original: ApplicationSettingDto["value"]) => {
    if (typeof original !== "object" || original === null) return false;
    const draft = draftObjectValues[key];
    if (!draft) return false;
    return Object.keys(original).some((k) => {
      const origVal = (original as Record<string, unknown>)[k];
      const draftVal = draft[k];
      if (typeof origVal === "boolean") {
        return draftVal !== origVal;
      }
      return draftVal !== (origVal ?? "");
    });
  };

  return (
    <ResourcePageShell
      resource={settingsResource}
      description="View and update application settings."
      isRefreshing={settings.isFetching}
      onRefresh={() => settings.refetch()}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription className="text-xs">
                {settings.data
                  ? `${settings.data.data.length} settings`
                  : "Persisted settings returned by the API."}
              </CardDescription>
            </div>
            <div className="relative w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search settings…"
                className="h-8 pl-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {settings.isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-5" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search ? "No settings match your search." : "No settings found."}
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((setting) => {
                const isObject =
                  typeof setting.value === "object" && setting.value !== null;
                const objValue = isObject
                  ? (setting.value as Record<string, string | boolean | number | null>)
                  : null;
                const hasChanges = isObject
                  ? objectDraftChanged(setting.key, setting.value)
                  : draftValues[setting.key] !== undefined &&
                    draftValues[setting.key] !== initDraft(setting.value);
                return (
                  <div
                    key={setting.key}
                    className="rounded-xl border border-border p-4"
                  >
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
                        <Label
                          htmlFor={`setting-${setting.key}`}
                          className="text-xs"
                        >
                          Override value
                        </Label>

                        {isObject && objValue ? (
                          <div className="space-y-2 rounded-lg border border-border p-3">
                            {Object.entries(objValue).map(([k, v]) => (
                              <SettingField
                                key={k}
                                label={k}
                                value={
                                  hasObjectDraft(setting.key)
                                    ? (draftObjectValues[setting.key]?.[k] ?? v)
                                    : v
                                }
                                onChange={(val) =>
                                  setDraftObjectValues((prev) => {
                                    const base = prev[setting.key] ?? {} as Record<string, string | boolean>;
                                    for (const [bk, bv] of Object.entries(objValue)) {
                                      if (!(bk in base)) {
                                        base[bk] = typeof bv === "boolean" ? bv : String(bv ?? "");
                                      }
                                    }
                                    return {
                                      ...prev,
                                      [setting.key]: { ...base, [k]: val },
                                    };
                                  })
                                }
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <Input
                              id={`setting-${setting.key}`}
                              value={
                                draftValues[setting.key] ??
                                initDraft(setting.value)
                              }
                              onChange={(e) =>
                                setDraftValues((prev) => ({
                                  ...prev,
                                  [setting.key]: e.target.value,
                                }))
                              }
                            />
                            {hasChanges && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  const next = { ...draftValues };
                                  delete next[setting.key];
                                  setDraftValues(next);
                                }}
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        )}

                        {hasChanges && (
                          <div className="flex gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSavingKey(setting.key);
                                setConfirmOpen(true);
                              }}
                              disabled={updateSetting.isPending}
                            >
                              {updateSetting.isPending &&
                              savingKey === setting.key ? (
                                <Spinner className="size-3.5" />
                              ) : null}
                              Save
                            </Button>
                            {isObject && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  const next = { ...draftObjectValues };
                                  delete next[setting.key];
                                  setDraftObjectValues(next);
                                }}
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
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Save setting"
        message="Are you sure you want to update this setting? It will take effect immediately."
        confirmLabel="Save"
        loading={updateSetting.isPending}
        onCancel={() => {
          setConfirmOpen(false);
          setSavingKey(null);
        }}
        onConfirm={handleSave}
      />
    </ResourcePageShell>
  );
}
