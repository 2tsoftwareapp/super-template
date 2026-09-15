import { describe, expect, it, vi } from "vitest";

import type { EnvironmentService } from "@repo/api-runtime";

import {
  AppHealthIndicator,
  DatabaseHealthIndicator,
  RedisHealthIndicator,
} from "../health.indicators";

function createIndicator() {
  return {
    down: vi.fn((details?: unknown) => ({ status: "down", details })),
    up: vi.fn(() => ({ status: "up" })),
  };
}

describe("health indicators", () => {
  it("marks app liveness as up", () => {
    const indicator = createIndicator();
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };

    const result = new AppHealthIndicator(healthIndicatorService as never).isHealthy("app");

    expect(healthIndicatorService.check).toHaveBeenCalledWith("app");
    expect(result).toEqual({ status: "up" });
  });

  it("marks database readiness as up after a successful query", async () => {
    const indicator = createIndicator();
    const database = { execute: vi.fn().mockResolvedValue(undefined) };
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };

    const result = await new DatabaseHealthIndicator(
      database as never,
      healthIndicatorService as never,
    ).isHealthy("database");

    expect(database.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "up" });
  });

  it("marks database readiness as down when the query fails", async () => {
    const indicator = createIndicator();
    const database = { execute: vi.fn().mockRejectedValue(new Error("offline")) };
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };

    const result = await new DatabaseHealthIndicator(
      database as never,
      healthIndicatorService as never,
    ).isHealthy("database");

    expect(result).toEqual({
      status: "down",
      details: { reason: "database query failed" },
    });
  });

  it("marks redis readiness as up when ping succeeds", async () => {
    const indicator = createIndicator();
    const client = {
      isOpen: true,
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue("PONG"),
    };
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };
    const environmentService = {
      redisUrl: "redis://localhost:6379",
    } as unknown as EnvironmentService;

    const result = await new RedisHealthIndicator(
      environmentService,
      healthIndicatorService as never,
      client as never,
    ).isHealthy("redis");

    expect(client.ping).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "up" });
  });

  it("connects client before pinging when isOpen is false", async () => {
    const indicator = createIndicator();
    const client = {
      isOpen: false,
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue("PONG"),
    };
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };
    const environmentService = {
      redisUrl: "redis://localhost:6379",
    } as unknown as EnvironmentService;

    const result = await new RedisHealthIndicator(
      environmentService,
      healthIndicatorService as never,
      client as never,
    ).isHealthy("redis");

    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.ping).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "up" });
  });

  it("marks redis readiness as down when ping fails", async () => {
    const indicator = createIndicator();
    const client = {
      isOpen: true,
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockRejectedValue(new Error("redis connection lost")),
    };
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };
    const environmentService = {
      redisUrl: "redis://localhost:6379",
    } as unknown as EnvironmentService;

    const result = await new RedisHealthIndicator(
      environmentService,
      healthIndicatorService as never,
      client as never,
    ).isHealthy("redis");

    expect(result).toEqual({
      status: "down",
      details: { reason: "redis ping failed" },
    });
  });

  it("marks redis readiness as down when redisUrl is not configured", async () => {
    const indicator = createIndicator();
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };
    const environmentService = {
      redisUrl: undefined,
      isProduction: false,
    } as unknown as EnvironmentService;

    const result = await new RedisHealthIndicator(
      environmentService,
      healthIndicatorService as never,
    ).isHealthy("redis");

    expect(result).toEqual({
      status: "down",
      details: { reason: "redis url not configured" },
    });
  });

  it("explains that REDIS_URL is required when production probes without it", async () => {
    const indicator = createIndicator();
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };
    const environmentService = {
      redisUrl: undefined,
      isProduction: true,
    } as unknown as EnvironmentService;

    const result = await new RedisHealthIndicator(
      environmentService,
      healthIndicatorService as never,
    ).isHealthy("redis");

    expect(result).toEqual({
      status: "down",
      details: {
        reason: expect.stringContaining("required in production"),
      },
    });
  });
});
