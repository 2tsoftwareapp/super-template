import type { AccessControlRepositoryPort } from "../../ports/access-control.repository.port";

import { AccessProfileCache } from "@repo/api-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccessProfileUseCase } from "../access-profile.use-case";

describe("AccessProfileUseCase", () => {
  let repository: Partial<AccessControlRepositoryPort>;
  let cache: AccessProfileCache;
  let useCase: AccessProfileUseCase;

  beforeEach(() => {
    repository = {
      findRoleNamesForUser: vi.fn(),
      findPermissionNamesForUser: vi.fn(),
      findUserIdsForRole: vi.fn(),
      findUserIdsForPermission: vi.fn(),
    };

    cache = new AccessProfileCache({
      redisUrl: undefined,
      accessProfileCacheTtlSeconds: 60,
    } as unknown as ConstructorParameters<typeof AccessProfileCache>[0]);

    vi.spyOn(cache, "get");
    vi.spyOn(cache, "set");
    vi.spyOn(cache, "invalidateUser");
    vi.spyOn(cache, "invalidateUsers");

    useCase = new AccessProfileUseCase(repository as AccessControlRepositoryPort, cache);
  });

  describe("getAccessProfile", () => {
    it("returns cached profile on cache hit without querying repository", async () => {
      const cachedProfile = {
        roles: ["ADMIN"],
        permissions: ["users.read"],
      };

      await cache.set("user-1", cachedProfile, "org-1");
      vi.mocked(repository.findRoleNamesForUser!).mockResolvedValue(["DIFFERENT"]);

      const result = await useCase.getAccessProfile("user-1", "org-1");

      expect(result).toEqual(cachedProfile);
      expect(repository.findRoleNamesForUser).not.toHaveBeenCalled();
      expect(repository.findPermissionNamesForUser).not.toHaveBeenCalled();
    });

    it("queries repository and populates cache on cache miss for organization scope", async () => {
      vi.mocked(repository.findRoleNamesForUser!).mockResolvedValue(["ORG_MEMBER"]);
      vi.mocked(repository.findPermissionNamesForUser!).mockResolvedValue(["documents.read"]);

      const result = await useCase.getAccessProfile("user-1", "org-1");

      expect(result).toEqual({
        roles: ["ORG_MEMBER"],
        permissions: ["documents.read"],
      });
      expect(repository.findRoleNamesForUser).toHaveBeenCalledWith("user-1", "org-1");
      expect(repository.findPermissionNamesForUser).toHaveBeenCalledWith("user-1", "org-1");
      expect(cache.set).toHaveBeenCalledWith(
        "user-1",
        { roles: ["ORG_MEMBER"], permissions: ["documents.read"] },
        "org-1",
      );

      // Subsequent call should hit cache
      const cachedResult = await useCase.getAccessProfile("user-1", "org-1");
      expect(cachedResult).toEqual(result);
      expect(repository.findRoleNamesForUser).toHaveBeenCalledTimes(1);
    });

    it("queries repository and populates cache for global scope (null org)", async () => {
      vi.mocked(repository.findRoleNamesForUser!).mockResolvedValue(["SUPER_ADMIN"]);
      vi.mocked(repository.findPermissionNamesForUser!).mockResolvedValue(["*"]);

      const result = await useCase.getAccessProfile("user-super", null);

      expect(result).toEqual({
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
      });
      expect(repository.findRoleNamesForUser).toHaveBeenCalledWith("user-super", null);
      expect(repository.findPermissionNamesForUser).toHaveBeenCalledWith("user-super", null);
      expect(cache.set).toHaveBeenCalledWith(
        "user-super",
        { roles: ["SUPER_ADMIN"], permissions: ["*"] },
        null,
      );
    });
  });

  describe("invalidation", () => {
    it("invalidates single user profile across scopes", async () => {
      await cache.set("user-1", { roles: ["A"], permissions: [] }, null);
      await cache.set("user-1", { roles: ["B"], permissions: [] }, "org-1");

      await useCase.invalidateAccessProfile("user-1");

      expect(cache.invalidateUser).toHaveBeenCalledWith("user-1");
      expect(await cache.get("user-1", null)).toBeNull();
      expect(await cache.get("user-1", "org-1")).toBeNull();
    });

    it("invalidates all users associated with a role", async () => {
      vi.mocked(repository.findUserIdsForRole!).mockResolvedValue(["user-1", "user-2"]);

      await useCase.invalidateUsersForRole("role-1");

      expect(repository.findUserIdsForRole).toHaveBeenCalledWith("role-1", undefined);
      expect(cache.invalidateUsers).toHaveBeenCalledWith(["user-1", "user-2"]);
    });

    it("invalidates all users associated with a permission", async () => {
      vi.mocked(repository.findUserIdsForPermission!).mockResolvedValue(["user-3"]);

      await useCase.invalidateUsersForPermission("perm-1");

      expect(repository.findUserIdsForPermission).toHaveBeenCalledWith("perm-1", undefined);
      expect(cache.invalidateUsers).toHaveBeenCalledWith(["user-3"]);
    });
  });
});
