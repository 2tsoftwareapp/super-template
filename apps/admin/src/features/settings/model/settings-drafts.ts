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
