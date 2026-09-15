import type { JsonObject } from "../types/json-value";

/**
 * Kernel-owned mail port (moved from @repo/feature-mail so that features can
 * send templated mail without depending on the mail feature). The mail
 * feature binds the implementing adapter when it is composed into the app.
 */
export interface MailTemplateSendInput {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  metadata?: JsonObject | null;
  sourceJobId?: string | null;
}

export interface MailTemplateSender {
  sendTemplate(input: MailTemplateSendInput): Promise<void>;
}

export const MAIL_TEMPLATE_SENDER = Symbol("MAIL_TEMPLATE_SENDER");
