import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";

import { MANDATORY_MAIL_TEMPLATE_KEYS } from "../../../domain/mandatory-mail-templates";
import type { DeliveryRecord } from "../../ports/mail-deliveries.repository.port";
import { SendMailTemplateUseCase } from "../send-mail-template.use-case";

const MANDATORY_TEMPLATE = MANDATORY_MAIL_TEMPLATE_KEYS[0];
const OPTIONAL_TEMPLATE = "admin.broadcast";
const RECIPIENT = "user@example.test";

const buildDelivery = (overrides: Partial<DeliveryRecord> = {}): DeliveryRecord => ({
  id: "delivery-1",
  organizationId: "org-1",
  templateKey: OPTIONAL_TEMPLATE,
  recipient: RECIPIENT,
  subject: "Hello",
  status: "PENDING",
  errorMessage: null,
  metadata: null,
  sentAt: null,
  leaseExpiresAt: null,
  claimToken: null,
  providerMessageId: null,
  createdAt: new Date("2026-09-15T09:00:00.000Z"),
  ...overrides,
});

type MockFn = ReturnType<typeof vi.fn>;

function buildHarness(
  options: {
    created?: DeliveryRecord | null;
    renderer?: MockFn;
    existingForSourceJob?: { status: string } | null;
    reclaimed?: DeliveryRecord | null;
    claimed?: DeliveryRecord | null;
    updateStatus?: MockFn;
    markProviderAccepted?: MockFn;
    mailerSend?: MockFn;
    preferences?: { email: boolean; push: boolean } | null;
  } = {},
) {
  const mailer = {
    send: options.mailerSend ?? vi.fn(async () => undefined),
  };
  const templateRenderer = {
    render:
      options.renderer ??
      vi.fn(async () => ({ subject: " Hello ", text: " body ", html: " <p>body</p> " })),
  };
  const mailDeliveriesRepository = {
    create: vi.fn(async () => (options.created === undefined ? buildDelivery() : options.created)),
    findBySourceJobId: vi.fn(async () => options.existingForSourceJob ?? null),
    claimForProcessing: vi.fn(async () =>
      options.claimed === undefined
        ? buildDelivery({ status: "PROCESSING", claimToken: "token-1" })
        : options.claimed,
    ),
    reclaimForRetry: vi.fn(async () => options.reclaimed ?? null),
    updateStatus: options.updateStatus ?? vi.fn(async () => undefined),
    markProviderAccepted: options.markProviderAccepted ?? vi.fn(async () => undefined),
  };
  const userPreferencesLookup = {
    findNotificationPreferencesByUserId: vi.fn(async () => ({ email: true, push: true })),
    findNotificationPreferencesByEmail: vi.fn(async () =>
      options.preferences === undefined ? null : options.preferences,
    ),
  };

  const useCase = new SendMailTemplateUseCase(
    mailer as never,
    templateRenderer as never,
    mailDeliveriesRepository as never,
    userPreferencesLookup as never,
  );

  return { useCase, mailer, templateRenderer, mailDeliveriesRepository, userPreferencesLookup };
}

describe("SendMailTemplateUseCase state machine", () => {
  it("marks the delivery SENT and stores the provider message id", async () => {
    const harness = buildHarness();

    await harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} });

    expect(harness.mailDeliveriesRepository.create).toHaveBeenCalledWith({
      templateKey: OPTIONAL_TEMPLATE,
      recipient: RECIPIENT,
      subject: "Hello",
      status: "PENDING",
      errorMessage: null,
      metadata: null,
      sourceJobId: null,
    });

    expect(harness.mailDeliveriesRepository.claimForProcessing).toHaveBeenCalledWith("delivery-1");

    // Trimmed body + deterministic provider idempotency key.
    expect(harness.mailer.send).toHaveBeenCalledWith({
      to: RECIPIENT,
      subject: "Hello",
      text: "body",
      html: "<p>body</p>",
      messageId: "mail-delivery-1",
    });

    expect(harness.mailDeliveriesRepository.updateStatus).toHaveBeenCalledWith(
      "delivery-1",
      "token-1",
      {
        status: "SENT",
        sentAt: expect.any(Date),
        errorMessage: null,
        providerMessageId: "mail-delivery-1",
      },
    );
    expect(harness.mailDeliveriesRepository.markProviderAccepted).not.toHaveBeenCalled();
  });

  it("marks FAILED, records the provider error, and rethrows so the job retries", async () => {
    const harness = buildHarness({
      mailerSend: vi.fn(async () => {
        throw new Error("smtp down");
      }),
    });

    await expect(
      harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} }),
    ).rejects.toThrow("smtp down");

    expect(harness.mailDeliveriesRepository.updateStatus).toHaveBeenCalledWith(
      "delivery-1",
      "token-1",
      {
        status: "FAILED",
        errorMessage: "smtp down",
        providerMessageId: "mail-delivery-1",
      },
    );
    expect(harness.mailDeliveriesRepository.markProviderAccepted).not.toHaveBeenCalled();
  });

  it("falls back to PROVIDER_ACCEPTED when the fenced SENT write fails after delivery", async () => {
    const harness = buildHarness({
      updateStatus: vi.fn(async () => {
        throw new Error("stale worker");
      }),
    });

    await expect(
      harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} }),
    ).resolves.toBeUndefined();

    expect(harness.mailDeliveriesRepository.markProviderAccepted).toHaveBeenCalledWith(
      "delivery-1",
      "mail-delivery-1",
    );
  });

  it("swallows the error when both the fenced and unfenced status writes fail", async () => {
    const harness = buildHarness({
      updateStatus: vi.fn(async () => {
        throw new Error("stale worker");
      }),
      markProviderAccepted: vi.fn(async () => {
        throw new Error("connection dropped");
      }),
    });

    await expect(
      harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} }),
    ).resolves.toBeUndefined();

    expect(harness.mailer.send).toHaveBeenCalledTimes(1);
    expect(harness.mailDeliveriesRepository.markProviderAccepted).toHaveBeenCalledTimes(1);
  });

  it("skips the send when another worker already claimed the row", async () => {
    const harness = buildHarness({ claimed: null });

    await harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} });

    expect(harness.mailer.send).not.toHaveBeenCalled();
    expect(harness.mailDeliveriesRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("skips the send when the claim did not end up PROCESSING", async () => {
    const harness = buildHarness({ claimed: buildDelivery({ status: "SENT" }) });

    await harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} });

    expect(harness.mailer.send).not.toHaveBeenCalled();
  });
});

describe("SendMailTemplateUseCase idempotency", () => {
  it.each(["SENT", "PROVIDER_ACCEPTED"])(
    "never re-sends a delivery already in %s",
    async (status) => {
      const harness = buildHarness({
        created: null,
        existingForSourceJob: { status },
      });

      await harness.useCase.execute({
        templateKey: OPTIONAL_TEMPLATE,
        to: RECIPIENT,
        variables: {},
        sourceJobId: "job-1",
      });

      expect(harness.mailDeliveriesRepository.findBySourceJobId).toHaveBeenCalledWith(
        "job-1",
        RECIPIENT,
      );
      expect(harness.mailDeliveriesRepository.reclaimForRetry).not.toHaveBeenCalled();
      expect(harness.mailer.send).not.toHaveBeenCalled();
    },
  );

  it("reclaims a FAILED delivery for the same source job and retries the send", async () => {
    const harness = buildHarness({
      created: null,
      existingForSourceJob: { status: "FAILED" },
      reclaimed: buildDelivery({ status: "PENDING" }),
    });

    await harness.useCase.execute({
      templateKey: OPTIONAL_TEMPLATE,
      to: RECIPIENT,
      variables: {},
      sourceJobId: "job-1",
    });

    expect(harness.mailDeliveriesRepository.reclaimForRetry).toHaveBeenCalledWith(
      "job-1",
      RECIPIENT,
    );
    expect(harness.mailer.send).toHaveBeenCalledTimes(1);
    expect(harness.mailDeliveriesRepository.updateStatus).toHaveBeenCalledWith(
      "delivery-1",
      "token-1",
      expect.objectContaining({ status: "SENT" }),
    );
  });

  it("fails when the delivery row exists but cannot be reclaimed", async () => {
    const harness = buildHarness({
      created: null,
      existingForSourceJob: { status: "PROCESSING" },
      reclaimed: null,
    });

    await expect(
      harness.useCase.execute({
        templateKey: OPTIONAL_TEMPLATE,
        to: RECIPIENT,
        variables: {},
        sourceJobId: "job-1",
      }),
    ).rejects.toThrow("Mail delivery already attempted but not confirmed sent");

    expect(harness.mailer.send).not.toHaveBeenCalled();
  });

  it("fails when the insert conflicts without a source job to reclaim", async () => {
    const harness = buildHarness({ created: null });

    await expect(
      harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} }),
    ).rejects.toThrow("Mail delivery already attempted but not confirmed sent");

    expect(harness.mailDeliveriesRepository.findBySourceJobId).not.toHaveBeenCalled();
    expect(harness.mailer.send).not.toHaveBeenCalled();
  });
});

describe("SendMailTemplateUseCase notification preferences", () => {
  it("skips a non-mandatory template when the recipient opted out of email", async () => {
    const harness = buildHarness({ preferences: { email: false, push: true } });

    await harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} });

    expect(harness.userPreferencesLookup.findNotificationPreferencesByEmail).toHaveBeenCalledWith(
      RECIPIENT,
    );
    expect(harness.templateRenderer.render).not.toHaveBeenCalled();
    expect(harness.mailDeliveriesRepository.create).not.toHaveBeenCalled();
    expect(harness.mailer.send).not.toHaveBeenCalled();
  });

  it("sends a non-mandatory template when the recipient has no preference row", async () => {
    const harness = buildHarness({ preferences: null });

    await harness.useCase.execute({ templateKey: OPTIONAL_TEMPLATE, to: RECIPIENT, variables: {} });

    expect(harness.mailer.send).toHaveBeenCalledTimes(1);
  });

  it("sends mandatory templates even when email notifications are off", async () => {
    const harness = buildHarness({ preferences: { email: false, push: false } });

    await harness.useCase.execute({
      templateKey: MANDATORY_TEMPLATE,
      to: RECIPIENT,
      variables: {},
    });

    // Account-critical mail bypasses the preference gate entirely.
    expect(harness.userPreferencesLookup.findNotificationPreferencesByEmail).not.toHaveBeenCalled();
    expect(harness.mailer.send).toHaveBeenCalledTimes(1);
  });
});

describe("SendMailTemplateUseCase rendering failures", () => {
  it("rejects an unknown template before writing a delivery row", async () => {
    const harness = buildHarness({
      renderer: vi.fn(async () => {
        throw new Error("template not found");
      }),
    });

    await expect(
      harness.useCase.execute({ templateKey: "does.not-exist", to: RECIPIENT, variables: {} }),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });

    expect(harness.mailDeliveriesRepository.create).not.toHaveBeenCalled();
    expect(harness.mailer.send).not.toHaveBeenCalled();
  });
});
