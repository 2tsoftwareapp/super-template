import { SMTPServer } from "smtp-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { handlers } from "../handlers";
import { PermanentJobError } from "../permanent-job-error";

describe("mail.send handler", () => {
  const received: string[] = [];
  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onData(stream, _session, callback) {
      const chunks: Buffer[] = [];

      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        received.push(Buffer.concat(chunks).toString("utf8"));
        callback(null, "queued");
      });
    },
  });

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    const address = server.server.address();

    if (!address || typeof address === "string") {
      throw new Error("SMTP test server did not bind a port");
    }

    process.env.SMTP_URL = `smtp://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("sends a real SMTP message through the configured transport", async () => {
    const result = (await handlers["mail.send"]?.({
      to: "person@example.local",
      subject: "Job mail",
      text: "hello from the worker",
    })) as { messageId: string };

    expect(result.messageId).toBeTruthy();
    expect(received).toHaveLength(1);
    expect(received[0]).toContain("Subject: Job mail");
    expect(received[0]).toContain("hello from the worker");
  });

  it("fails loudly when SMTP is not configured", async () => {
    const previous = process.env.SMTP_URL;
    delete process.env.SMTP_URL;

    await expect(
      handlers["mail.send"]?.({ to: "x@example.local", subject: "s", text: "t" }),
    ).rejects.toThrow("SMTP_URL is not configured");

    process.env.SMTP_URL = previous;
  });

  it("rejects a malformed payload as a permanent failure", async () => {
    await expect(handlers["mail.send"]?.({ to: 42, subject: "s" })).rejects.toBeInstanceOf(
      PermanentJobError,
    );
  });
});
