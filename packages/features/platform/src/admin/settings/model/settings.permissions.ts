export interface SettingsManagementPermissions {
  canRead: boolean;
  canUpdate: boolean;
}

/**
 * Settings permission selector. Centralizes `settings.*` permission checks so
 * views receive booleans instead of repeating `permissions.includes(...)`.
 */
export function selectSettingsPermissions(
  permissions: readonly string[] | undefined,
): SettingsManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canRead: granted.has("settings.read"),
    canUpdate: granted.has("settings.update"),
  };
}
