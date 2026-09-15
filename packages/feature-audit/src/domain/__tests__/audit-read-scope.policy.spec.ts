import { AppError, PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { describe, expect, it } from "vitest";

import {
  canReadAuditRow,
  isPlatformSuperAdmin,
  resolveAuditReadScope,
} from "../audit-read-scope.policy";

const PLATFORM_SUPER_ADMIN = PLATFORM_ROLE_NAMES.SUPER_ADMIN;

const actor = (roles: string[], organizationId: string | null) => ({ roles, organizationId });

describe("audit read scope policy", () => {
  describe("resolveAuditReadScope", () => {
    it("gives SUPER_ADMIN with an organization the platform scope", () => {
      expect(resolveAuditReadScope(actor([PLATFORM_SUPER_ADMIN], "org-1"))).toEqual({
        kind: "platform",
      });
    });

    it("gives SUPER_ADMIN without an organization the platform scope", () => {
      expect(resolveAuditReadScope(actor([PLATFORM_SUPER_ADMIN], null))).toEqual({
        kind: "platform",
      });
    });

    it("scopes a non-super actor with an organization to that organization", () => {
      expect(resolveAuditReadScope(actor(["ADMIN"], "org-1"))).toEqual({
        kind: "organization",
        organizationId: "org-1",
      });
    });

    it("forbids a non-super actor without an organization", () => {
      let thrown: unknown;

      try {
        resolveAuditReadScope(actor(["ADMIN"], null));
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(AppError);
      expect(thrown).toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
    });
  });

  describe("canReadAuditRow", () => {
    it("lets the platform scope read another organization's row", () => {
      expect(canReadAuditRow({ kind: "platform" }, "org-other")).toBe(true);
    });

    it("lets the platform scope read platform-scoped rows (organizationId null)", () => {
      expect(canReadAuditRow({ kind: "platform" }, null)).toBe(true);
    });

    it("lets an organization scope read its own row", () => {
      expect(canReadAuditRow({ kind: "organization", organizationId: "org-1" }, "org-1")).toBe(
        true,
      );
    });

    it("blocks an organization scope from another organization's row", () => {
      expect(canReadAuditRow({ kind: "organization", organizationId: "org-1" }, "org-2")).toBe(
        false,
      );
    });

    it("blocks an organization scope from platform-scoped rows", () => {
      expect(canReadAuditRow({ kind: "organization", organizationId: "org-1" }, null)).toBe(false);
    });
  });

  describe("isPlatformSuperAdmin", () => {
    it("matches only the platform super-role", () => {
      expect(isPlatformSuperAdmin(actor([PLATFORM_SUPER_ADMIN], null))).toBe(true);
      expect(isPlatformSuperAdmin(actor(["ADMIN"], "org-1"))).toBe(false);
      expect(isPlatformSuperAdmin(actor([], null))).toBe(false);
    });
  });
});
