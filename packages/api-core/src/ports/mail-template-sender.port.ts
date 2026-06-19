import type { JsonObject } from '../common/types/json-value';
export interface MailTemplateSendInput {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  metadata?: JsonObject | null;
}

export interface MailTemplateSender {
  sendTemplate(input: MailTemplateSendInput): Promise<void>;
}

export const MAIL_TEMPLATE_SENDER = Symbol('MAIL_TEMPLATE_SENDER');
