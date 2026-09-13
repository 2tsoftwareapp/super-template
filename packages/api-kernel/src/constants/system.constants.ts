export const SYSTEM_SCOPE = {
  PLATFORM: "platform",
  ORGANIZATION: "organization",
} as const;

export type SystemScope = (typeof SYSTEM_SCOPE)[keyof typeof SYSTEM_SCOPE];

/**
 * Default organization-model options. Registries that do not select an
 * organization-model capability keep the historical personal-organization
 * behavior (organizations effectively mandatory).
 */
export const DEFAULT_ORGANIZATION_MODEL_OPTIONS = {
  organizationModel: "personal-orgs",
} as const;
