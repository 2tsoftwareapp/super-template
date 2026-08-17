import { randomBytes } from "node:crypto";

import { base32Encode } from "./totp";

const RECOVERY_CODE_COUNT = 8;

const formatRecoveryCode = (raw: string): string => `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;

export const generateRecoveryCodes = (count = RECOVERY_CODE_COUNT): string[] =>
  Array.from({ length: count }, () => formatRecoveryCode(base32Encode(randomBytes(5))));

// Recovery codes are compared case-insensitively and dash-insensitively, so
// hash the normalized form consistently at generation and verification time.
export const normalizeRecoveryCode = (raw: string): string =>
  raw.toUpperCase().replace(/[^A-Z2-7]/g, "");
