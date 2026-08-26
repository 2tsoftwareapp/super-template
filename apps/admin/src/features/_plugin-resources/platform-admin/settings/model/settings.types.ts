import type { ApplicationSettingDto } from "@repo/web-utils/api-types";

export type SettingValue = ApplicationSettingDto["value"];

export interface SettingsViewModel {
  canRead: boolean;
  canUpdate: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  totalCount: number | null;
  filtered: ApplicationSettingDto[];
  onSave: (key: string, value: SettingValue) => void;
  isSavingKey: string | null;
}
