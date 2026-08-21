import { describe, expect, it } from "vitest";

import { selectMailPermissions } from "../mail.permissions";

describe("mail.permissions", () => {
  it("grants read + send with both permissions", () => {
    expect(selectMailPermissions(["mail.read", "mail.create"])).toEqual({
      canRead: true,
      canSend: true,
    });
  });

  it("send requires mail.create", () => {
    expect(selectMailPermissions(["mail.read"]).canSend).toBe(false);
    expect(selectMailPermissions(["mail.create"]).canSend).toBe(true);
  });

  it("returns false for empty permissions", () => {
    expect(selectMailPermissions(undefined)).toEqual({ canRead: false, canSend: false });
  });
});
