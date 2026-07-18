export const SYSTEM_SCOPE = {
  PLATFORM: 'platform',
  ORGANIZATION: 'organization',
} as const;

export type SystemScope = (typeof SYSTEM_SCOPE)[keyof typeof SYSTEM_SCOPE];
