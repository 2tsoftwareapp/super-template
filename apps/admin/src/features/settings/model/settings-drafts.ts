import type { ApplicationSettingDto } from "@/lib/api-types";

type SettingValue = ApplicationSettingDto["value"];

/** Human-readable rendering of a setting value. Framework-free. */
export function displayValue(value: SettingValue): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

/** Initial draft string for a scalar setting value. Framework-free. */
export function initDraft(value: SettingValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function isObjectValue(value: SettingValue): boolean {
  return typeof value === "object" && value !== null;
}

/** Whether an object-setting draft differs from its original value. */
export function objectDraftChanged(
  original: SettingValue,
  draft: Record<string, string | boolean> | undefined,
): boolean {
  if (typeof original !== "object" || original === null || !draft) {
    return false;
  }

  return Object.keys(original).some((k) => {
    const origVal = (original as Record<string, unknown>)[k];
    const draftVal = draft[k];
    if (typeof origVal === "boolean") {
      return draftVal !== origVal;
    }
    return draftVal !== (origVal ?? "");
  });
}
