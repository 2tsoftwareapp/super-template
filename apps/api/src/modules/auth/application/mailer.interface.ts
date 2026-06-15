export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const MAILER = Symbol('MAILER');

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}
