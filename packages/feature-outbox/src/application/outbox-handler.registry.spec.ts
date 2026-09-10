import { describe, expect, it } from "vitest";
import { OutboxHandlerRegistry } from "./outbox-handler.registry";

describe("OutboxHandlerRegistry", () => {
  it("returns the immutable contribution list supplied by composition", () => {
    const contributions = [
      { topic: "user.created", handle: async () => undefined },
      { topic: "file.uploaded", handle: async () => undefined },
    ] as const;
    const registry = new OutboxHandlerRegistry(contributions);

    expect(registry.getAll()).toBe(contributions);
    expect(registry.getAll()).toHaveLength(2);
    expect(registry.getAll().map(({ topic }) => topic)).toEqual(["user.created", "file.uploaded"]);
  });
});
