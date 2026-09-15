/**
 * Templates that deliver account-critical messages (verification, password
 * reset). They bypass the notification-preference check, because suppressing
 * them would lock a user out of their own account.
 */
export const MANDATORY_MAIL_TEMPLATE_KEYS = ["auth.verify-email", "auth.reset-password"] as const;

export type MandatoryMailTemplateKey = (typeof MANDATORY_MAIL_TEMPLATE_KEYS)[number];

export function isMandatoryMailTemplate(templateKey: string): boolean {
  return (MANDATORY_MAIL_TEMPLATE_KEYS as readonly string[]).includes(templateKey);
}
