import { hashOpaqueToken } from "@repo/api-kernel";

import { normalizeRecoveryCode } from "./recovery-codes";

export const hashRecoveryCode = (code: string): string =>
  hashOpaqueToken(normalizeRecoveryCode(code));
