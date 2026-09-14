import { createHmac } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import { LocalFileDownloadUrlService } from "../local-file-download-url.service";

const SECRET = "test-signing-secret";
const BASE_URL = "http://localhost:3000";
const START = new Date("2026-09-15T00:00:00.000Z");

function buildService(overrides: Record<string, unknown> = {}) {
  return new LocalFileDownloadUrlService({
    values: {
      STORAGE_DRIVER: "local",
      API_INTERNAL_URL: BASE_URL,
      JWT_ACCESS_SECRET: SECRET,
      ...overrides,
    },
  } as never);
}

/** The signature contract the service signs: HMAC-SHA256 over the bound triple. */
function sign(fileId: string, storageKey: string, expiresAt: number, secret = SECRET) {
  return createHmac("sha256", secret).update(`${fileId}:${storageKey}:${expiresAt}`).digest("hex");
}

/** Pull the `expiresAt` and signature back out of a generated URL. */
function tokenOf(url: string) {
  const token = decodeURIComponent(new URL(url).searchParams.get("token") ?? "");
  const [expiresAtRaw, signature] = token.split(".", 2);
  return { token, expiresAt: Number(expiresAtRaw), signature: signature ?? "" };
}

describe("LocalFileDownloadUrlService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("enabled state and TTL", () => {
    it("is enabled only for the local storage driver", () => {
      expect(buildService().isEnabled()).toBe(true);
      expect(buildService({ STORAGE_DRIVER: "s3" }).isEnabled()).toBe(false);
    });

    it("exposes the TTL the callers use for both local and object-storage URLs", () => {
      expect(buildService().expiresInSeconds).toBe(3600);
    });
  });

  describe("createSignedUrl", () => {
    it("binds the token to the file, the storage key, and an expiry one TTL ahead", () => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const service = buildService();

      const url = service.createSignedUrl("file-1", "uploads/user-1/abc.png");
      const { token, expiresAt, signature } = tokenOf(url);

      expect(url.startsWith(`${BASE_URL}/api/v1/files/file-1/download?token=`)).toBe(true);
      expect(expiresAt).toBe(START.getTime() + 3600 * 1000);
      // The signature is a real HMAC over the bound triple, not an opaque blob:
      // this recomputes it independently so a weakening of the input string fails.
      expect(signature).toBe(sign("file-1", "uploads/user-1/abc.png", expiresAt));
      expect(token).toBe(`${expiresAt}.${signature}`);
    });

    it("strips a trailing slash from the configured base URL", () => {
      const url = buildService({ API_INTERNAL_URL: `${BASE_URL}/` }).createSignedUrl("f", "k");

      expect(url.startsWith(`${BASE_URL}/api/v1/files/f/download?token=`)).toBe(true);
      expect(url).not.toContain("//api/");
    });
  });

  describe("assertValidToken", () => {
    it("accepts a token it just issued for the same file and storage key", () => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const service = buildService();
      const { token } = tokenOf(service.createSignedUrl("file-1", "uploads/abc.png"));

      expect(() => service.assertValidToken("file-1", "uploads/abc.png", token)).not.toThrow();
    });

    it("rejects a missing token", () => {
      const service = buildService();

      try {
        service.assertValidToken("file-1", "uploads/abc.png", undefined);
        throw new Error("expected assertValidToken to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(ERROR_CODES.AUTH_FORBIDDEN);
        expect((error as AppError).statusCode).toBe(403);
      }
    });

    it.each([
      ["a tampered signature", (issued: string) => `${issued.slice(0, -1)}0`],
      ["a token with no signature part", () => "1900000000000"],
      ["a token with a non-numeric expiry", () => "not-a-number.deadbeef"],
      ["an empty string", () => ""],
    ])("rejects %s", (_name, corrupt) => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const service = buildService();
      const { token } = tokenOf(service.createSignedUrl("file-1", "uploads/abc.png"));

      expect(() => service.assertValidToken("file-1", "uploads/abc.png", corrupt(token))).toThrow(
        expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN }),
      );
    });

    it("rejects an expired token even though the signature is genuine", () => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const service = buildService();
      const { token, expiresAt } = tokenOf(service.createSignedUrl("file-1", "uploads/abc.png"));

      // One second past the TTL: the signature still verifies, the clock does not.
      vi.setSystemTime(new Date(expiresAt + 1000));

      expect(() => service.assertValidToken("file-1", "uploads/abc.png", token)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN }),
      );
    });

    it("still accepts a token one second before it expires", () => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const service = buildService();
      const { token, expiresAt } = tokenOf(service.createSignedUrl("file-1", "uploads/abc.png"));

      vi.setSystemTime(new Date(expiresAt - 1000));

      expect(() => service.assertValidToken("file-1", "uploads/abc.png", token)).not.toThrow();
    });

    it("rejects a valid token replayed against a different file id", () => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const service = buildService();
      const { token } = tokenOf(service.createSignedUrl("file-1", "uploads/abc.png"));

      // The file id is part of the signed triple, so a token cannot be moved to
      // another file even when the expiry is untouched.
      expect(() => service.assertValidToken("file-2", "uploads/abc.png", token)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN }),
      );
    });

    it("rejects a valid token replayed against a different storage key", () => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const service = buildService();
      const { token } = tokenOf(service.createSignedUrl("file-1", "uploads/abc.png"));

      expect(() => service.assertValidToken("file-1", "uploads/private.png", token)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN }),
      );
    });

    it("rejects a token signed with a different secret", () => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
      const service = buildService();
      const expiresAt = START.getTime() + 3600 * 1000;

      const forged = `${expiresAt}.${sign("file-1", "uploads/abc.png", expiresAt, "other-secret")}`;

      expect(() => service.assertValidToken("file-1", "uploads/abc.png", forged)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN }),
      );
    });
  });
});
