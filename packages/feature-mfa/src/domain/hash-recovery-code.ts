import { hashOpaqueToken } from "@repo/api-runtime";

import { normalizeRecoveryCode } from "./recovery-codes";

export const hashRecoveryCode = (code: string): string =>
  hashOpaqueToken(normalizeRecoveryCode(code));
