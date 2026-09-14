import { describe, expect, it, vi } from "vitest";

import { listSettingDefaults } from "../../setting-definitions";
import { EnsureSettingsSeedDataUseCase } from "../ensure-settings-seed-data.use-case";

describe("EnsureSettingsSeedDataUseCase", () => {
  it("seeds exactly the registry defaults", async () => {
    const ensureDefaults = vi.fn(async () => undefined);
    const useCase = new EnsureSettingsSeedDataUseCase({ ensureDefaults } as never);
    const executor = { id: "tx" };

    await useCase.execute(executor as never);

    expect(ensureDefaults).toHaveBeenCalledTimes(1);
    expect(ensureDefaults.mock.calls[0]?.[0]).toEqual(listSettingDefaults());
    expect(ensureDefaults.mock.calls[0]?.[1]).toBe(executor);
  });

  it("writes the documented baseline rows", async () => {
    const ensureDefaults = vi.fn(async () => undefined);
    const useCase = new EnsureSettingsSeedDataUseCase({ ensureDefaults } as never);

    await useCase.execute();

    // Registry defaults are the seed: registry ↔ seed parity is asserted here
    // so a drift shows up as a failing test, not as a silent behavior change.
    expect(ensureDefaults).toHaveBeenCalledWith(
      [
        { key: "registration_enabled", value: { enabled: true } },
        { key: "maintenance_mode", value: { enabled: false, message: null } },
      ],
      undefined,
    );
  });
});
