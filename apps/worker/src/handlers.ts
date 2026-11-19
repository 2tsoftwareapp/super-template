import nodemailer from "nodemailer";

export type JobHandler = (payload: unknown) => Promise<unknown>;

interface MailPayload {
  to: string;
  subject: string;
  text: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

/** Created lazily so a worker without mail configured still runs other jobs. */
function mailTransport() {
  const url = process.env.SMTP_URL;

  if (!url) {
    throw new Error("SMTP_URL is not configured");
  }

  transporter ??= nodemailer.createTransport(url);

  return transporter;
}

/**
 * One entry per job type. Add a handler here and the queue starts running it;
 * there is no registry, decorator or manifest to keep in sync.
 */
export const handlers: Record<string, JobHandler> = {
  "demo.echo": async (payload) => ({ echo: payload, processedAt: new Date().toISOString() }),

  "demo.fail": async () => {
    throw new Error("demo failure (intentional)");
  },

  "mail.send": async (payload) => {
    const { to, subject, text } = payload as MailPayload;
    const info = await mailTransport().sendMail({
      from: process.env.MAIL_FROM ?? "no-reply@example.local",
      to,
      subject,
      text,
    });

    return { messageId: info.messageId };
  },
};
