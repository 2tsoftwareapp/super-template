import { describe, expect, it, vi } from "vitest";

import { GetMfaStatusUseCase } from "../get-mfa-status.use-case";

const USER_ID = "u1";

describe("GetMfaStatusUseCase", () => {
  it("reports disabled when no secret row exists", async () => {
    const mfaRepository = { findSecretByUserId: vi.fn(async () => null) };
    const useCase = new GetMfaStatusUseCase(mfaRepository as never);

    await expect(useCase.execute(USER_ID)).resolves.toEqual({ enabled: false });
    expect(mfaRepository.findSecretByUserId).toHaveBeenCalledWith(USER_ID);
  });

  it("reports disabled while a setup is still unconfirmed", async () => {
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({ userId: USER_ID, enabled: false })),
    };
    const useCase = new GetMfaStatusUseCase(mfaRepository as never);

    await expect(useCase.execute(USER_ID)).resolves.toEqual({ enabled: false });
  });

  it("reports enabled once the secret is confirmed", async () => {
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({ userId: USER_ID, enabled: true })),
    };
    const useCase = new GetMfaStatusUseCase(mfaRepository as never);

    await expect(useCase.execute(USER_ID)).resolves.toEqual({ enabled: true });
  });
});
