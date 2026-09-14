import { describe, expect, it, vi } from "vitest";

import { encryptTotpSecret } from "@repo/feature-mfa/contracts";

import {
  SSO_CIPHER_V1_PREFIX,
  SSO_CIPHER_V2_PREFIX,
  SsoCipherKeyError,
  decryptSsoSecret,
  encryptSsoSecret,
  type SsoCipherKeys,
} from "../sso-cipher";

const V1_KEY = "a".repeat(64);
const V2_KEY = "b".repeat(64);
const PLAINTEXT = "pkce-code-verifier-3f9a2c";

describe("sso-cipher (versioned SSO secrets at rest)", () => {
  it("round-trips plaintext with the v2 SSO key and prefixes the ciphertext", () => {
    const keys: SsoCipherKeys = { v1: V1_KEY, v2: V2_KEY };
    const onWarn = vi.fn();

    const secret = encryptSsoSecret(PLAINTEXT, keys, onWarn);

    expect(secret.ciphertext.startsWith(SSO_CIPHER_V2_PREFIX)).toBe(true);
    expect(onWarn).not.toHaveBeenCalled();
    expect(decryptSsoSecret(secret, keys)).toBe(PLAINTEXT);
  });

  it("decrypts v1 data when the v2 key is present (rotation path)", () => {
    // Data written while only the legacy MFA key existed.
    const legacy = encryptTotpSecret(Buffer.from(PLAINTEXT, "utf8"), V1_KEY);

    const decrypted = decryptSsoSecret(legacy, { v1: V1_KEY, v2: V2_KEY });

    expect(decrypted).toBe(PLAINTEXT);
  });

  it("decrypts v1-prefixed data written during the fallback window", () => {
    const keys: SsoCipherKeys = { v1: V1_KEY, v2: V2_KEY };
    const onWarn = vi.fn();
    const secret = encryptSsoSecret(PLAINTEXT, { v1: V1_KEY, v2: undefined }, onWarn);

    expect(secret.ciphertext.startsWith(SSO_CIPHER_V1_PREFIX)).toBe(true);
    expect(onWarn).toHaveBeenCalledTimes(1);
    expect(decryptSsoSecret(secret, keys)).toBe(PLAINTEXT);
  });

  it("falls back to the v1 MFA key with a warning when the v2 key is missing", () => {
    const onWarn = vi.fn();

    const secret = encryptSsoSecret(PLAINTEXT, { v1: V1_KEY, v2: undefined }, onWarn);

    expect(secret.ciphertext.startsWith(SSO_CIPHER_V1_PREFIX)).toBe(true);
    expect(onWarn).toHaveBeenCalledWith(expect.stringContaining("SSO_ENCRYPTION_KEY"));
    expect(decryptSsoSecret(secret, { v1: V1_KEY, v2: undefined })).toBe(PLAINTEXT);
  });

  it("fails explicitly when neither key is configured for encryption", () => {
    expect(() => encryptSsoSecret(PLAINTEXT, { v1: undefined, v2: undefined })).toThrow(
      SsoCipherKeyError,
    );
  });

  it("fails explicitly when v2 data is present but the v2 key is missing", () => {
    const secret = encryptSsoSecret(PLAINTEXT, { v1: V1_KEY, v2: V2_KEY });

    expect(() => decryptSsoSecret(secret, { v1: V1_KEY, v2: undefined })).toThrow(
      SsoCipherKeyError,
    );
  });

  it("fails explicitly when legacy data is present but the v1 key is missing", () => {
    const legacy = encryptTotpSecret(Buffer.from(PLAINTEXT, "utf8"), V1_KEY);

    expect(() => decryptSsoSecret(legacy, { v1: undefined, v2: V2_KEY })).toThrow(
      SsoCipherKeyError,
    );
  });
});
