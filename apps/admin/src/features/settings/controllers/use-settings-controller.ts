"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { SettingRow, SettingsViewModel } from "@/features/settings/model/settings.types";
import type { ApplicationSettingDto } from "@/lib/api-types";

import { useUpdateSettingMutation } from "@/features/settings/api/settings.mutations";
import { useSettingsQuery } from "@/features/settings/api/settings.queries";
import { settingsKeys } from "@/features/settings/api/settings.query-keys";
import {
  initDraft,
  isObjectValue,
  objectDraftChanged,
} from "@/features/settings/model/settings-drafts";
import { selectSettingsPermissions } from "@/features/settings/model/settings.permissions";
import { updateSettingInputSchema } from "@/features/settings/model/settings.schemas";
import { useSession } from "@/hooks/use-session";
import { parseJsonValue } from "@/lib/json";

export type { SettingsViewModel };

type SettingValue = ApplicationSettingDto["value"];

function buildSettingRow(
  setting: ApplicationSettingDto,
  canUpdate: boolean,
  draftValues: Record<string, string>,
  draftObjectValues: Record<string, Record<string, string | boolean>>,
  updateSettingIsPending: boolean,
  savingKey: string | null,
  onSetDraftValues: (
    updater: (prev: Record<string, string>) => Record<string, string>,
  ) => void,
  onSetDraftObjectValues: (
    updater: (
      prev: Record<string, Record<string, string | boolean>>,
    ) => Record<string, Record<string, string | boolean>>,
  ) => void,
  onRequestSave: () => void,
): SettingRow {
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
    isSaving: updateSettingIsPending && savingKey === setting.key,
    canUpdate,
    scalar: {
      value: draftValues[setting.key] ?? initDraft(setting.value),
      onChange: (value) =>
        onSetDraftValues((prev) => ({ ...prev, [setting.key]: value })),
      onReset: () =>
        onSetDraftValues((prev) => {
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
                onSetDraftObjectValues((prev) => {
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
              onSetDraftObjectValues((prev) => {
                const next = { ...prev };
                delete next[setting.key];
                return next;
              }),
          }
        : null,
    onRequestSave,
  };
}

/**
 * Orchestration hook for the settings screen.
 *
 * Flow:
 *   1. Session → settings read/update permission booleans.
 *   2. Load settings list (staleTime 5 min); client-side search filter.
 *   3. Track scalar + object draft state; detect per-setting changes.
 *   4. Save: confirm dialog → light Zod validation → PATCH → toast on error.
 */
export function useSettingsController(): SettingsViewModel {
  const queryClient = useQueryClient();
  const session = useSession();
  const { canRead, canUpdate } = selectSettingsPermissions(
    session.data?.data?.permissions,
  );

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
    onError: (error) => {
      setSavingKey(null);
      toast.error(getErrorMessage(error));
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

    const parsed = updateSettingInputSchema.safeParse({
      key: savingKey,
      value: next,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid setting value");
      return;
    }

    updateSetting.mutate({
      key: parsed.data.key,
      value: parsed.data.value as SettingValue,
    });
    setConfirmOpen(false);
  };

  const handleRetry = () => {
    void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
  };

  const getRow = (setting: ApplicationSettingDto): SettingRow => {
    return buildSettingRow(
      setting,
      canUpdate,
      draftValues,
      draftObjectValues,
      updateSetting.isPending,
      savingKey,
      setDraftValues,
      setDraftObjectValues,
      () => {
        setSavingKey(setting.key);
        setConfirmOpen(true);
      },
    );
  };

  return {
    canRead,
    canUpdate,
    search,
    onSearchChange: setSearch,
    isLoading: settings.isLoading,
    isRefreshing: settings.isFetching,
    isError: settings.isError,
    onRetry: handleRetry,
    onRefresh: handleRetry,
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
