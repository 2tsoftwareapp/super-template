import { decryptTotpSecret, encryptTotpSecret } from "@repo/feature-mfa/contracts";

/**
 * Versioned AES-256-GCM cipher for SSO secrets at rest (PKCE verifiers, stored
 * provider identity payloads).
 *
 * The ciphertext column carries a version prefix so the key that can decrypt a
 * row travels with the data:
 *
 * - `v1:` — encrypted with the legacy MFA_ENCRYPTION_KEY (rows written before
 *   key separation, and new rows in deployments that never set SSO_ENCRYPTION_KEY).
 * - `v2:` — encrypted with the dedicated SSO_ENCRYPTION_KEY (current).
 * - no prefix — legacy rows written before versioning existed; they always used
 *   the MFA key, so they decrypt exactly like `v1:`.
 *
 * Keeping a dedicated SSO key decouples SSO secret rotation from MFA key
 * rotation: rotating MFA_ENCRYPTION_KEY no longer breaks stored SSO state.
 */
export const SSO_CIPHER_V1_PREFIX = "v1:";
export const SSO_CIPHER_V2_PREFIX = "v2:";

const PREFIX_LENGTH = 3;

export interface SsoCipherKeys {
  /** Legacy MFA_ENCRYPTION_KEY — required to read v1/unprefixed rows. */
  v1: string | undefined;
  /** Dedicated SSO_ENCRYPTION_KEY — preferred for new rows when present. */
  v2: string | undefined;
}

export interface VersionedSsoSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/** Thrown when the key needed for a (de)cipher operation is not configured. */
export class SsoCipherKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsoCipherKeyError";
  }
}

export function encryptSsoSecret(
  plaintext: string,
  keys: SsoCipherKeys,
  onWarn?: (message: string) => void,
): VersionedSsoSecret {
  if (keys.v2) {
    const encrypted = encryptTotpSecret(Buffer.from(plaintext, "utf8"), keys.v2);

    return { ...encrypted, ciphertext: `${SSO_CIPHER_V2_PREFIX}${encrypted.ciphertext}` };
  }

  if (keys.v1) {
    onWarn?.(
      "SSO_ENCRYPTION_KEY is not configured; falling back to the legacy MFA_ENCRYPTION_KEY " +
        "(v1) for SSO secrets at rest. Set SSO_ENCRYPTION_KEY to decouple SSO key rotation " +
        "from MFA key rotation.",
    );
    const encrypted = encryptTotpSecret(Buffer.from(plaintext, "utf8"), keys.v1);

    return { ...encrypted, ciphertext: `${SSO_CIPHER_V1_PREFIX}${encrypted.ciphertext}` };
  }

  throw new SsoCipherKeyError(
    "No encryption key available for SSO secrets: set SSO_ENCRYPTION_KEY (preferred) " +
      "or MFA_ENCRYPTION_KEY (legacy fallback).",
  );
}

export function decryptSsoSecret(secret: VersionedSsoSecret, keys: SsoCipherKeys): string {
  if (secret.ciphertext.startsWith(SSO_CIPHER_V2_PREFIX)) {
    if (!keys.v2) {
      throw new SsoCipherKeyError(
        "SSO secret was encrypted with SSO_ENCRYPTION_KEY (v2) but SSO_ENCRYPTION_KEY is " +
          "not configured in this environment; the value cannot be decrypted.",
      );
    }

    return decryptTotpSecret(
      {
        ciphertext: secret.ciphertext.slice(PREFIX_LENGTH),
        iv: secret.iv,
        authTag: secret.authTag,
      },
      keys.v2,
    ).toString("utf8");
  }

  // `v1:`-prefixed rows and unprefixed legacy rows both use the MFA key.
  const isPrefixedV1 = secret.ciphertext.startsWith(SSO_CIPHER_V1_PREFIX);

  if (!keys.v1) {
    throw new SsoCipherKeyError(
      "SSO secret was encrypted with the legacy MFA_ENCRYPTION_KEY (v1) but " +
        "MFA_ENCRYPTION_KEY is not configured in this environment; the value cannot be " +
        "decrypted.",
    );
  }

  return decryptTotpSecret(
    {
      ciphertext: isPrefixedV1 ? secret.ciphertext.slice(PREFIX_LENGTH) : secret.ciphertext,
      iv: secret.iv,
      authTag: secret.authTag,
    },
    keys.v1,
  ).toString("utf8");
}
