import { loadMailEnv } from "@lean/config";
import nodemailer from "nodemailer";

import { PermanentJobError } from "./permanent-job-error";

export type JobHandler = (payload: unknown) => Promise<unknown>;

interface MailPayload {
  to: string;
  subject: string;
  text: string;
}

let transporter: { url: string; transport: ReturnType<typeof nodemailer.createTransport> } | null =
  null;

/** Created lazily so a worker without mail configured still runs other jobs. */
function mailTransport(url: string) {
  if (transporter?.url !== url) {
    transporter = { url, transport: nodemailer.createTransport(url) };
  }

  return transporter.transport;
}

const isText = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/** The queue stores JSON: validate it here instead of trusting a cast. */
function parseMailPayload(payload: unknown): MailPayload {
  if (payload instanceof Object && "to" in payload && "subject" in payload && "text" in payload) {
    const { to, subject, text } = payload;

    if (isText(to) && isText(subject) && isText(text)) {
      return { to, subject, text };
    }
  }

  throw new PermanentJobError("mail.send payload needs non-empty to, subject and text");
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
    const mail = parseMailPayload(payload);
    const env = loadMailEnv();

    if (!env.SMTP_URL) {
      throw new Error("SMTP_URL is not configured");
    }

    const info = await mailTransport(env.SMTP_URL).sendMail({ from: env.MAIL_FROM, ...mail });

    return { messageId: info.messageId };
  },
};
