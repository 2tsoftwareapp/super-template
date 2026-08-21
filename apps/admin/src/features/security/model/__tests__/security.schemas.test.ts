import { describe, expect, it } from "vitest";

import { changePasswordSchema } from "../security.schemas";

describe("changePasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "longenough1",
      confirmPassword: "longenough1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "longenough1",
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("requires current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "longenough1",
      confirmPassword: "longenough1",
    });
    expect(result.success).toBe(false);
  });
});
