/**
 * Cross-context read-only view of application settings. Implemented by the
 * platform settings module; consumed by bounded contexts that need to enforce
 * global toggles (e.g. registration policy, maintenance mode).
 */
export interface ApplicationSettingsLookup {
  isRegistrationEnabled(): Promise<boolean>;
  isMaintenanceMode(): Promise<boolean>;
}

export const APPLICATION_SETTINGS_LOOKUP = Symbol('APPLICATION_SETTINGS_LOOKUP');
