import type { ApplicationSettingDto } from "@/lib/api-types";

import {
  initDraft,
  isObjectValue,
  objectDraftChanged,
} from "@/features/settings/model/settings-drafts";

import type { SettingRow } from "./settings-view-model";

export function buildSettingRow(
  setting: ApplicationSettingDto,
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
