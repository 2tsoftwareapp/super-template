import { describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "@repo/api-core";

import { RegisterUseCase } from "../register.use-case";

function buildUseCase(
  overrides: {
    registrationEnabled?: boolean;
  } = {},
) {
  const registrationEnabled = overrides.registrationEnabled ?? true;

  const applicationSettingsLookup = {
    isRegistrationEnabled: vi.fn(async () => registrationEnabled),
    isMaintenanceMode: vi.fn(async () => false),
  };

  const useCase = new RegisterUseCase(
    {
      run: vi.fn(async (fn: (tx: unknown) => unknown) => fn(null)),
    } as never,
    { findByEmail: vi.fn(async () => null) } as never,
    {} as never,
    { log: vi.fn() } as never,
    {} as never,
    {} as never,
    applicationSettingsLookup as never,
    {} as never,
  );

  return { useCase, applicationSettingsLookup };
}

describe("RegisterUseCase", () => {
  it("rejects registration when the registration_enabled setting is off", async () => {
    const { useCase } = buildUseCase({ registrationEnabled: false });

    await expect(
      useCase.execute({
        email: "new@test.com",
        password: "strong-password-123",
        displayName: "New User",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.REGISTRATION_DISABLED,
    });
  });

  it("proceeds when registration is enabled", async () => {
    const { useCase, applicationSettingsLookup } = buildUseCase({
      registrationEnabled: true,
    });

    await expect(
      useCase.execute({
        email: "new@test.com",
        password: "strong-password-123",
        displayName: "New User",
      }),
    ).rejects.not.toMatchObject({
      code: ERROR_CODES.REGISTRATION_DISABLED,
    });

    expect(applicationSettingsLookup.isRegistrationEnabled).toHaveBeenCalled();
  });
});
