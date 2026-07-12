"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { ApplicationSettingDto } from "@/lib/api-types";

import {
  initDraft,
  isObjectValue,
  objectDraftChanged,
} from "@/features/settings/settings-drafts";
import { useUpdateSettingMutation } from "@/features/settings/use-settings-mutations";
import { useSettingsQuery } from "@/features/settings/use-settings-queries";
import { parseJsonValue } from "@/lib/json";

type SettingValue = ApplicationSettingDto["value"];

export interface SettingObjectField {
  key: string;
  value: string | boolean | number | null;
  onChange: (value: string | boolean) => void;
}

export interface SettingRow {
  setting: ApplicationSettingDto;
  isObject: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  scalar: {
    value: string;
    onChange: (value: string) => void;
    onReset: () => void;
  };
  object: { fields: SettingObjectField[]; onReset: () => void } | null;
  onRequestSave: () => void;
}

export interface SettingsViewModel {
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  totalCount: number | null;
  filtered: ApplicationSettingDto[];
  getRow: (setting: ApplicationSettingDto) => SettingRow;
  confirm: {
    open: boolean;
    isSaving: boolean;
    onCancel: () => void;
    onConfirm: () => void;
  };
}

/**
 * Orchestration hook for the settings screen: settings query, search filter,
 * scalar + object draft state, per-setting change detection, save mutation and
 * confirm dialog. Exposes a getRow(setting) helper so the presentational view
 * stays render-only.
 */
export function useSettingsController(): SettingsViewModel {
  const settings = useSettingsQuery();

  const [search, setSearch] = useState("");
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [draftObjectValues, setDraftObjectValues] = useState<
    Record<string, Record<string, string | boolean>>
  >({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filtered = useMemo(() => {
    const all = settings.data?.data ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter((s) => s.key.toLowerCase().includes(q));
  }, [settings.data?.data, search]);

  const updateSetting = useUpdateSettingMutation({
    onSuccess: () => {
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

    let next: SettingValue;
    if (isObject && draftObjectValues[savingKey]) {
      next = draftObjectValues[savingKey];
    } else {
      const raw =
        draftValues[savingKey] ?? initDraft(setting?.value ?? (null as never));
      next = parseJsonValue(raw) as SettingValue;
    }

    updateSetting.mutate({ key: savingKey, value: next });
    setConfirmOpen(false);
  };

  const getRow = (setting: ApplicationSettingDto): SettingRow => {
    const isObject = isObjectValue(setting.value);
    const objValue = isObject
      ? (setting.value as Record<string, string | boolean | number | null>)
      : null;

    const hasObjectDraft = draftObjectValues[setting.key] !== undefined;
    const hasChanges = isObject
      ? objectDraftChanged(setting.value, draftObjectValues[setting.key])
      : draftValues[setting.key] !== undefined &&
        draftValues[setting.key] !== initDraft(setting.value);

    return {
      setting,
      isObject,
      hasChanges,
      isSaving: updateSetting.isPending && savingKey === setting.key,
      scalar: {
        value: draftValues[setting.key] ?? initDraft(setting.value),
        onChange: (value) =>
          setDraftValues((prev) => ({ ...prev, [setting.key]: value })),
        onReset: () =>
          setDraftValues((prev) => {
            const next = { ...prev };
            delete next[setting.key];
            return next;
          }),
      },
      object:
        isObject && objValue
          ? {
              fields: Object.entries(objValue).map(([k, v]) => ({
                key: k,
                value: hasObjectDraft
                  ? (draftObjectValues[setting.key]?.[k] ?? v)
                  : v,
                onChange: (val) =>
                  setDraftObjectValues((prev) => {
                    const base = prev[setting.key] ?? {};
                    for (const [bk, bv] of Object.entries(objValue)) {
                      if (!(bk in base)) {
                        base[bk] =
                          typeof bv === "boolean" ? bv : String(bv ?? "");
                      }
                    }
                    return {
                      ...prev,
                      [setting.key]: { ...base, [k]: val },
                    };
                  }),
              })),
              onReset: () =>
                setDraftObjectValues((prev) => {
                  const next = { ...prev };
                  delete next[setting.key];
                  return next;
                }),
            }
          : null,
      onRequestSave: () => {
        setSavingKey(setting.key);
        setConfirmOpen(true);
      },
    };
  };

  return {
    search,
    onSearchChange: setSearch,
    isLoading: settings.isLoading,
    isRefreshing: settings.isFetching,
    onRefresh: () => void settings.refetch(),
    totalCount: settings.data ? settings.data.data.length : null,
    filtered,
    getRow,
    confirm: {
      open: confirmOpen,
      isSaving: updateSetting.isPending,
      onCancel: () => {
        setConfirmOpen(false);
        setSavingKey(null);
      },
      onConfirm: handleSave,
    },
  };
}
