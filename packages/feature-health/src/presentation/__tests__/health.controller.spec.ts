import { describe, expect, it, vi } from "vitest";

import type { HealthCheckService } from "@nestjs/terminus";
import type { EnvironmentService } from "@repo/api-runtime";

import type { HealthWarningsService } from "../../application/health-warnings.service";
import type {
  AppHealthIndicator,
  DatabaseHealthIndicator,
  RedisHealthIndicator,
} from "../../application/health.indicators";
import { HealthController } from "../health.controller";

describe("HealthController", () => {
  function createSetup(
    options: {
      redisUrl?: string | undefined;
      isProduction?: boolean;
      warnings?: string[] | undefined;
    } = {},
  ) {
    const executedChecks: Array<() => Promise<unknown> | unknown> = [];
    const health = {
      check: vi.fn(async (checks: Array<() => Promise<unknown> | unknown>) => {
        executedChecks.push(...checks);
        return Promise.all(checks.map((fn) => fn()));
      }),
    } as unknown as HealthCheckService;

    const appHealthIndicator = {
      isHealthy: vi.fn(() => ({ status: "up" })),
    } as unknown as AppHealthIndicator;

    const databaseHealthIndicator = {
      isHealthy: vi.fn(async () => ({ status: "up" })),
    } as unknown as DatabaseHealthIndicator;

    const redisHealthIndicator = {
      isHealthy: vi.fn(async () => ({ status: "up" })),
    } as unknown as RedisHealthIndicator;

    const healthWarningsService = {
      collect: vi.fn(() => options.warnings ?? []),
    } as unknown as HealthWarningsService;

    const environmentService = {
      redisUrl: options.redisUrl,
      isProduction: options.isProduction ?? false,
    } as unknown as EnvironmentService;

    const controller = new HealthController(
      health,
      appHealthIndicator,
      databaseHealthIndicator,
      redisHealthIndicator,
      healthWarningsService,
      environmentService,
    );

    return {
      controller,
      health,
      appHealthIndicator,
      databaseHealthIndicator,
      redisHealthIndicator,
      healthWarningsService,
      environmentService,
      executedChecks,
    };
  }

  describe("getHealth (liveness)", () => {
    it("runs only the app health check and returns status ok with warnings", async () => {
      const {
        controller,
        health,
        appHealthIndicator,
        databaseHealthIndicator,
        redisHealthIndicator,
      } = createSetup({ warnings: ["Some operational warning"] });

      const response = await controller.getHealth();

      expect(health.check).toHaveBeenCalledTimes(1);
      expect(appHealthIndicator.isHealthy).toHaveBeenCalledWith("app");
      expect(databaseHealthIndicator.isHealthy).not.toHaveBeenCalled();
      expect(redisHealthIndicator.isHealthy).not.toHaveBeenCalled();
      expect(response).toEqual({
        data: {
          status: "ok",
          warnings: ["Some operational warning"],
        },
      });
    });
  });

  describe("getReady (readiness)", () => {
    it("runs app and database health checks when redisUrl is not configured", async () => {
      const {
        controller,
        health,
        appHealthIndicator,
        databaseHealthIndicator,
        redisHealthIndicator,
      } = createSetup({ redisUrl: undefined });

      const response = await controller.getReady();

      expect(health.check).toHaveBeenCalledTimes(1);
      expect(appHealthIndicator.isHealthy).toHaveBeenCalledWith("app");
      expect(databaseHealthIndicator.isHealthy).toHaveBeenCalledWith("database");
      expect(redisHealthIndicator.isHealthy).not.toHaveBeenCalled();
      expect(response).toEqual({
        data: {
          status: "ready",
          warnings: [],
        },
      });
    });

    it("runs app, database, and redis health checks when redisUrl is configured", async () => {
      const {
        controller,
        health,
        appHealthIndicator,
        databaseHealthIndicator,
        redisHealthIndicator,
      } = createSetup({ redisUrl: "redis://localhost:6379" });

      const response = await controller.getReady();

      expect(health.check).toHaveBeenCalledTimes(1);
      expect(appHealthIndicator.isHealthy).toHaveBeenCalledWith("app");
      expect(databaseHealthIndicator.isHealthy).toHaveBeenCalledWith("database");
      expect(redisHealthIndicator.isHealthy).toHaveBeenCalledWith("redis");
      expect(response).toEqual({
        data: {
          status: "ready",
          warnings: [],
        },
      });
    });

    it("still probes redis in production without REDIS_URL so readiness fails loudly", async () => {
      const { controller, redisHealthIndicator, healthWarningsService } = createSetup({
        isProduction: true,
        redisUrl: undefined,
        warnings: ["Production configuration requires REDIS_URL"],
      });

      const response = await controller.getReady();

      // The shared policy decides: a misconfigured production must not skip the
      // redis probe (that would report ready while the warnings say otherwise).
      expect(redisHealthIndicator.isHealthy).toHaveBeenCalledWith("redis");
      expect(response).toEqual({
        data: {
          status: "ready",
          warnings: ["Production configuration requires REDIS_URL"],
        },
      });
      expect(healthWarningsService.collect).toHaveBeenCalledTimes(1);
    });

    it("propagates error when health check fails", async () => {
      const { controller, health } = createSetup();
      vi.mocked(health.check).mockRejectedValueOnce(new Error("Service Unavailable"));

      await expect(controller.getReady()).rejects.toThrow("Service Unavailable");
    });
  });
});
