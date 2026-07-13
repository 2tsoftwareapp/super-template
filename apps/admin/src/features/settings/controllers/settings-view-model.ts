import type { ApplicationSettingDto } from "@/lib/api-types";

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
