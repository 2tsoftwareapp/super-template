import { afterEach, describe, expect, it, vi } from "vitest";

import type { EnvironmentService } from "../../config/environment";

// Controllable fake redis client shared with the mocked adapter module.
const { connectMock, getMock, setMock, delMock, keysMock, onMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  getMock: vi.fn(),
  setMock: vi.fn(),
  delMock: vi.fn(),
  keysMock: vi.fn(),
  onMock: vi.fn(),
}));

vi.mock("../../redis/redis-client.adapter", () => ({
  createRedisClient: () => ({}),
  adaptRedisClient: () => ({
    connect: connectMock,
    get: getMock,
    set: setMock,
    del: delMock,
    keys: keysMock,
    on: onMock,
    quit: vi.fn(),
  }),
}));

import { AccessProfileCache } from "../access-profile.cache";

function redisEnv(): EnvironmentService {
  return {
    redisUrl: "redis://localhost:6379",
    accessProfileCacheTtlSeconds: 60,
  } as unknown as EnvironmentService;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("AccessProfileCache (redis path resilience)", () => {
  it("falls back to a cache miss when the redis connection fails", async () => {
    connectMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const cache = new AccessProfileCache(redisEnv());

    await expect(cache.get("user-1")).resolves.toBeNull();
  });

  it("retries the connection on a later call after an initial failure", async () => {
    connectMock.mockRejectedValueOnce(new Error("ECONNREFUSED")).mockResolvedValueOnce(undefined);
    getMock.mockResolvedValue(null);
    const cache = new AccessProfileCache(redisEnv());

    await cache.get("user-1"); // first attempt fails → fallback
    await cache.get("user-1"); // second attempt reconnects

    expect(connectMock).toHaveBeenCalledTimes(2);
  });

  it("reads and parses a cached profile from redis", async () => {
    connectMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue(JSON.stringify({ roles: ["ADMIN"], permissions: ["users.read"] }));
    const cache = new AccessProfileCache(redisEnv());

    await expect(cache.get("user-1")).resolves.toEqual({
      roles: ["ADMIN"],
      permissions: ["users.read"],
    });
  });

  it("reads and parses an organization-scoped profile from redis", async () => {
    connectMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue(JSON.stringify({ roles: ["ORG_ADMIN"], permissions: ["org.write"] }));
    const cache = new AccessProfileCache(redisEnv());

    const result = await cache.get("user-1", "org-1");

    expect(getMock).toHaveBeenCalledWith("access-profile:user-1:org-1");
    expect(result).toEqual({
      roles: ["ORG_ADMIN"],
      permissions: ["org.write"],
    });
  });

  it("stores an organization-scoped profile in redis with TTL", async () => {
    connectMock.mockResolvedValue(undefined);
    setMock.mockResolvedValue("OK");
    const cache = new AccessProfileCache(redisEnv());

    await cache.set("user-1", { roles: ["ORG_ADMIN"], permissions: ["org.write"] }, "org-1");

    expect(setMock).toHaveBeenCalledWith(
      "access-profile:user-1:org-1",
      JSON.stringify({ roles: ["ORG_ADMIN"], permissions: ["org.write"] }),
      { EX: 60 },
    );
  });
  it("treats a transient redis get error as a cache miss instead of throwing", async () => {
    connectMock.mockResolvedValue(undefined);
    getMock.mockRejectedValue(new Error("connection lost"));
    const cache = new AccessProfileCache(redisEnv());

    await expect(cache.get("user-1")).resolves.toBeNull();
  });

  it("invalidates multiple users in a single redis call when keys pattern matching is used", async () => {
    connectMock.mockResolvedValue(undefined);
    keysMock.mockImplementation((pattern: string) => {
      if (pattern === "access-profile:user-1*") {
        return Promise.resolve([
          "access-profile:user-1",
          "access-profile:user-1:org-1",
          "access-profile:user-10", // should be filtered out
        ]);
      }
      if (pattern === "access-profile:user-2*") {
        return Promise.resolve(["access-profile:user-2:org-2"]);
      }
      return Promise.resolve([]);
    });
    delMock.mockResolvedValue(3);
    const cache = new AccessProfileCache(redisEnv());

    await cache.invalidateUsers(["user-1", "user-2"]);

    expect(delMock).toHaveBeenCalledTimes(1);
    expect(delMock).toHaveBeenCalledWith([
      "access-profile:user-1",
      "access-profile:user-1:org-1",
      "access-profile:user-2:org-2",
    ]);
  });

  it("invalidates a single user in redis matching both global and org scopes", async () => {
    connectMock.mockResolvedValue(undefined);
    keysMock.mockResolvedValue([
      "access-profile:user-1",
      "access-profile:user-1:org-1",
      "access-profile:user-10", // should be filtered out
    ]);
    delMock.mockResolvedValue(2);
    const cache = new AccessProfileCache(redisEnv());

    await cache.invalidateUser("user-1");

    expect(delMock).toHaveBeenCalledWith(["access-profile:user-1", "access-profile:user-1:org-1"]);
  });
});
