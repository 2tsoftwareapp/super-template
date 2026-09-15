import type { NotificationChannelPreferences } from "../public/user-preferences-lookup.port";

/**
 * Interpret the stored notificationPreferences jsonb for delivery decisions.
 *
 * COMPATIBILITY RULE (default-on): a missing field — or any value that is not
 * exactly `false` — means the channel is ENABLED. Only an explicit `false`
 * opts a channel out. Existing rows were written before this policy was named
 * and rely on exactly this behavior; mail and notifications consume it
 * cross-feature, so do not tighten it without a data migration plan.
 */
export function resolveNotificationChannelPreferences(
  value: Record<string, unknown> | null | undefined,
): NotificationChannelPreferences {
  return {
    email: value?.email !== false,
    push: value?.push !== false,
  };
}
