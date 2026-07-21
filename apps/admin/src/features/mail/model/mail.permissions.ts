/**
 * Mail feature permission selector. Views receive booleans instead of
 * repeating `permissions.includes("mail.*")`.
 */
export interface MailManagementPermissions {
  canRead: boolean;
  canSend: boolean;
}

export function selectMailPermissions(
  permissions: readonly string[] | undefined,
): MailManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canRead: granted.has("mail.read"),
    canSend: granted.has("mail.create"),
  };
}
