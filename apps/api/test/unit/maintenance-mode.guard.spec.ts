import { describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "@repo/api-runtime";

import { MaintenanceModeGuard } from "../../src/shell/maintenance-mode.guard";

function buildContext(path: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ path }),
    }),
  } as never;
}

describe("MaintenanceModeGuard", () => {
  it("allows requests when maintenance mode is off", async () => {
    const applicationSettingsLookup = {
      isMaintenanceMode: vi.fn(async () => false),
    };

    const guard = new MaintenanceModeGuard(applicationSettingsLookup as never);

    await expect(guard.canActivate(buildContext("/api/v1/users/me"))).resolves.toBe(true);
    expect(applicationSettingsLookup.isMaintenanceMode).toHaveBeenCalled();
  });

  it("blocks non-exempt requests when maintenance mode is on", async () => {
    const guard = new MaintenanceModeGuard({
      isMaintenanceMode: vi.fn(async () => true),
    } as never);

    await expect(guard.canActivate(buildContext("/api/v1/users/me"))).rejects.toMatchObject({
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
    });
  });

  it("keeps health, login, SSO, and settings reachable during maintenance", async () => {
    const guard = new MaintenanceModeGuard({
      isMaintenanceMode: vi.fn(async () => true),
    } as never);

    for (const path of [
      "/api/v1/health",
      "/api/v1/health/ready",
      "/api/v1/auth/login",
      "/api/v1/auth/sso/google/start",
      "/api/v1/admin/settings",
    ]) {
      await expect(guard.canActivate(buildContext(path))).resolves.toBe(true);
    }
  });
});
