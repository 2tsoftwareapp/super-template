import { describe, expect, it, vi } from "vitest";

import { TrackingObjectStorage } from "../tracking-object-storage.service";

function createWrapper(overrides?: Record<string, unknown>) {
  const inner = {
    upload: vi.fn(async (input: { key: string }) => ({ key: input.key })),
    read: vi.fn(async () => Buffer.from("data")),
    delete: vi.fn(async () => undefined),
    getSignedUrl: vi.fn(async () => "https://example.com/signed"),
    ...((overrides?.inner as Record<string, unknown>) ?? {}),
  };

  const tracking = {
    recordUpload: vi.fn(async () => undefined),
    recordDelete: vi.fn(async () => undefined),
    enqueueDelete: vi.fn(async () => undefined),
    ...((overrides?.tracking as Record<string, unknown>) ?? {}),
  };

  const wrapper = new TrackingObjectStorage(inner as never, tracking as never);

  return { wrapper, inner, tracking };
}

describe("TrackingObjectStorage", () => {
  it("records the upload after the driver succeeds", async () => {
    const { wrapper, inner, tracking } = createWrapper();

    const result = await wrapper.upload({
      key: "uploads/a.png",
      body: Buffer.from("x"),
      mimeType: "image/png",
    });

    expect(inner.upload).toHaveBeenCalledWith({
      key: "uploads/a.png",
      body: Buffer.from("x"),
      mimeType: "image/png",
    });
    expect(tracking.recordUpload).toHaveBeenCalledWith("uploads/a.png");
    expect(result).toEqual({ key: "uploads/a.png" });
  });

  it("does not fail the upload when the ledger write fails", async () => {
    const { wrapper, inner, tracking } = createWrapper({
      tracking: {
        recordUpload: vi.fn(async () => {
          throw new Error("ledger down");
        }),
      },
    });

    await expect(
      wrapper.upload({ key: "uploads/a.png", body: Buffer.from("x"), mimeType: "image/png" }),
    ).resolves.toEqual({ key: "uploads/a.png" });

    expect(inner.upload).toHaveBeenCalled();
    expect(tracking.recordUpload).toHaveBeenCalled();
  });

  it("marks the object deleted after a successful driver delete", async () => {
    const { wrapper, inner, tracking } = createWrapper();

    await wrapper.delete("uploads/a.png");

    expect(inner.delete).toHaveBeenCalledWith("uploads/a.png");
    expect(tracking.recordDelete).toHaveBeenCalledWith("uploads/a.png");
    expect(tracking.enqueueDelete).not.toHaveBeenCalled();
  });

  it("enqueues a retry and rethrows when the driver delete fails", async () => {
    const { wrapper, inner, tracking } = createWrapper({
      inner: {
        delete: vi.fn(async () => {
          throw new Error("storage unreachable");
        }),
      },
    });

    await expect(wrapper.delete("uploads/a.png")).rejects.toThrow("storage unreachable");

    expect(tracking.enqueueDelete).toHaveBeenCalledWith("uploads/a.png");
    expect(tracking.recordDelete).not.toHaveBeenCalled();
  });

  it("still rethrows when enqueueing the retry fails", async () => {
    const { wrapper, tracking } = createWrapper({
      inner: {
        delete: vi.fn(async () => {
          throw new Error("storage unreachable");
        }),
      },
      tracking: {
        enqueueDelete: vi.fn(async () => {
          throw new Error("ledger down");
        }),
      },
    });

    await expect(wrapper.delete("uploads/a.png")).rejects.toThrow("storage unreachable");
    expect(tracking.enqueueDelete).toHaveBeenCalled();
  });

  it("forwards read and getSignedUrl to the driver", async () => {
    const { wrapper, inner } = createWrapper();

    await expect(wrapper.read("uploads/a.png")).resolves.toEqual(Buffer.from("data"));
    await expect(wrapper.getSignedUrl("uploads/a.png", 60)).resolves.toBe(
      "https://example.com/signed",
    );

    expect(inner.read).toHaveBeenCalledWith("uploads/a.png");
    expect(inner.getSignedUrl).toHaveBeenCalledWith("uploads/a.png", 60);
  });
});
