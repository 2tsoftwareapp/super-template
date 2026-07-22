import { describe, expect, it } from "vitest";

import { roleSchema } from "../roles.schemas";

const UUID_A = "a1b2c3d4-1234-5678-9abc-def012345678";
const UUID_B = "b2c3d4e5-2345-6789-abcd-ef0123456789";

const validInput = {
  name: "Finance Manager",
  description: "Manages financial operations",
  permissionIds: [UUID_A, UUID_B],
};

describe("roleSchema", () => {
  it("accepts a valid role form", () => {
    const result = roleSchema.parse(validInput);

    expect(result.name).toBe("Finance Manager");
    expect(result.permissionIds).toEqual([UUID_A, UUID_B]);
  });

  it("trims whitespace from name", () => {
    const result = roleSchema.parse({ ...validInput, name: "  Finance Manager  " });
    expect(result.name).toBe("Finance Manager");
  });

  it("rejects names shorter than 2 characters", () => {
    expect(() => roleSchema.parse({ ...validInput, name: "A" })).toThrow();
  });

  it("rejects names longer than 80 characters", () => {
    expect(() => roleSchema.parse({ ...validInput, name: "A".repeat(81) })).toThrow();
  });

  it("rejects empty permissionIds array", () => {
    expect(() => roleSchema.parse({ ...validInput, permissionIds: [] })).toThrow();
  });

  it("rejects missing permissionIds", () => {
    const { permissionIds: _, ...rest } = validInput;
    expect(() => roleSchema.parse(rest)).toThrow();
  });

  it("rejects missing name", () => {
    const { name: _, ...rest } = validInput;
    expect(() => roleSchema.parse(rest)).toThrow();
  });

  it("allows description when provided", () => {
    const result = roleSchema.parse(validInput);
    expect(result.description).toBe("Manages financial operations");
  });

  it("omits description when not provided", () => {
    const { description: _, ...withoutDescription } = validInput;
    const result = roleSchema.parse(withoutDescription);
    expect(result.description).toBeUndefined();
  });

  it("rejects description longer than 500 characters", () => {
    expect(() =>
      roleSchema.parse({ ...validInput, description: "x".repeat(501) }),
    ).toThrow();
  });

  it("accepts optional organizationId", () => {
    const result = roleSchema.parse({ ...validInput, organizationId: UUID_A });
    expect(result.organizationId).toBe(UUID_A);
  });
});
