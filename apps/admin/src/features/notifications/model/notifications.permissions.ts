/**
 * Notifications feature permission selector.
 * Admin send/list/cancel jobs all require `notifications.create` on the API.
 */
export interface NotificationManagementPermissions {
  canRead: boolean;
  canSend: boolean;
  canCancel: boolean;
}

export function selectNotificationPermissions(
  permissions: readonly string[] | undefined,
): NotificationManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canRead: granted.has("notifications.read"),
    canSend: granted.has("notifications.create"),
    canCancel: granted.has("notifications.create"),
  };
}
