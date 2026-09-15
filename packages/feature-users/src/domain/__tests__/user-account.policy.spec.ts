import { describe, expect, it } from "vitest";

import {
  isAccountEmailUsable,
  isActiveUserAccount,
  isDeliverableUserAccount,
  softDeleteUserAccount,
  toAccountEmailKey,
  USER_ACCOUNT_SOFT_DELETE_MARKER,
  USER_ACCOUNT_STATUS,
} from "../user-account.policy";

describe("user-account.policy", () => {
  describe("isActiveUserAccount", () => {
    it("treats an account without a soft-delete marker as live", () => {
      expect(isActiveUserAccount({ deletedAt: null })).toBe(true);
    });

    it("treats a stamped account as gone, whatever its status", () => {
      expect(isActiveUserAccount({ deletedAt: new Date("2026-01-01T00:00:00Z") })).toBe(false);
    });
  });

  describe("softDeleteUserAccount", () => {
    it("stamps the marker and moves the account to BLOCKED", () => {
      const deletedAt = new Date("2026-01-01T00:00:00Z");

      expect(softDeleteUserAccount(deletedAt)).toEqual({
        deletedAt,
        status: USER_ACCOUNT_STATUS.BLOCKED,
      });
    });

    it("produces an account that no longer counts as live or deliverable", () => {
      const account = { ...softDeleteUserAccount(new Date()), status: "ACTIVE" };

      expect(isActiveUserAccount(account)).toBe(false);
      expect(isDeliverableUserAccount(account)).toBe(false);
    });

    it("names the same marker the persistence row exposes", () => {
      expect(Object.keys(softDeleteUserAccount(new Date()))).toContain(
        USER_ACCOUNT_SOFT_DELETE_MARKER,
      );
    });
  });

  describe("isDeliverableUserAccount", () => {
    it("accepts a live ACTIVE account", () => {
      expect(
        isDeliverableUserAccount({ status: USER_ACCOUNT_STATUS.ACTIVE, deletedAt: null }),
      ).toBe(true);
    });

    it("rejects a soft-deleted account even when its status is ACTIVE", () => {
      expect(
        isDeliverableUserAccount({ status: USER_ACCOUNT_STATUS.ACTIVE, deletedAt: new Date() }),
      ).toBe(false);
    });

    it.each([USER_ACCOUNT_STATUS.PENDING, USER_ACCOUNT_STATUS.BLOCKED])(
      "rejects a live account with status %s",
      (status) => {
        expect(isDeliverableUserAccount({ status, deletedAt: null })).toBe(false);
      },
    );
  });

  describe("toAccountEmailKey", () => {
    it("folds case and surrounding whitespace", () => {
      expect(toAccountEmailKey("  User@Example.COM ")).toBe("user@example.com");
    });

    it("is idempotent", () => {
      const key = toAccountEmailKey("User@Example.com");

      expect(toAccountEmailKey(key)).toBe(key);
    });
  });

  describe("isAccountEmailUsable", () => {
    it("accepts an address that normalizes to a value", () => {
      expect(isAccountEmailUsable("  User@Example.com ")).toBe(true);
    });

    it.each(["", "   "])("rejects %j, which normalizes to nothing", (email) => {
      expect(isAccountEmailUsable(email)).toBe(false);
    });
  });
});
