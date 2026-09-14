import type { JsonObject } from "@repo/api-kernel";
import type { JobHandlerContext } from "@repo/feature-jobs/contracts";

import { describe, expect, it, vi } from "vitest";

import { MailJobHandler } from "../mail-job.handler";

const buildContext = (payload: JsonObject, jobId = "job-1"): JobHandlerContext => ({
  jobId,
  payload,
  organizationId: "org-1",
  createdById: "user-1",
});

/**
 * Captures what the handler registers so the test can drive the exact callback
 * the jobs core would call.
 */
function buildHarness() {
  const registered: { type: string; handler: (context: JobHandlerContext) => Promise<void> }[] = [];
  const mailService = { sendTemplate: vi.fn(async () => undefined) };
  const handlerRegistry = {
    registerHandler: vi.fn(
      (type: string, handler: (context: JobHandlerContext) => Promise<void>) => {
        registered.push({ type, handler });
      },
    ),
  };

  const handler = new MailJobHandler(mailService as never, handlerRegistry as never);

  /** The callback the handler registered, as the jobs core would invoke it. */
  const registeredHandler = () => {
    const [entry] = registered;
    if (!entry) {
      throw new Error("MailJobHandler did not register a handler");
    }
    return entry.handler;
  };

  return { handler, mailService, handlerRegistry, registeredHandler };
}

describe("MailJobHandler", () => {
  it("registers itself for the mail.send job type", () => {
    const harness = buildHarness();

    harness.handler.onModuleInit();

    expect(harness.handler.type).toBe("mail.send");
    expect(harness.handlerRegistry.registerHandler).toHaveBeenCalledWith(
      "mail.send",
      expect.any(Function),
    );
  });

  it("maps the job payload onto a template send", async () => {
    const harness = buildHarness();
    harness.handler.onModuleInit();

    const context = buildContext(
      {
        templateKey: "admin.broadcast",
        to: "member@example.local",
        variables: { displayName: "Member" },
        metadata: { campaign: "september" },
      },
      "job-42",
    );

    await harness.registeredHandler()(context);

    expect(harness.mailService.sendTemplate).toHaveBeenCalledWith({
      templateKey: "admin.broadcast",
      to: "member@example.local",
      variables: { displayName: "Member" },
      metadata: { campaign: "september" },
      sourceJobId: "job-42",
    });
  });

  it("drops non-string variables and non-object metadata", async () => {
    const harness = buildHarness();
    harness.handler.onModuleInit();

    await harness.registeredHandler()(
      buildContext({
        templateKey: "admin.broadcast",
        to: "member@example.local",
        variables: { keep: "yes", drop: 42, alsoDrop: null },
        metadata: ["not", "an", "object"],
      }),
    );

    expect(harness.mailService.sendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { keep: "yes" }, metadata: null }),
    );
  });

  it("treats a missing variables object as empty", async () => {
    const harness = buildHarness();
    harness.handler.onModuleInit();

    await harness.registeredHandler()(
      buildContext({ templateKey: "admin.broadcast", to: "member@example.local" }),
    );

    expect(harness.mailService.sendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ variables: {}, metadata: null }),
    );
  });

  it.each([
    ["a non-string templateKey", { templateKey: 42, to: "member@example.local" }],
    ["a missing templateKey", { to: "member@example.local" }],
    ["an empty recipient", { templateKey: "admin.broadcast", to: "" }],
    ["a missing recipient", { templateKey: "admin.broadcast" }],
  ])("rejects %s without sending", async (_label, payload) => {
    const harness = buildHarness();
    harness.handler.onModuleInit();

    await expect(harness.registeredHandler()(buildContext(payload))).rejects.toThrow(
      "mail.send requires templateKey and to",
    );

    expect(harness.mailService.sendTemplate).not.toHaveBeenCalled();
  });
});
