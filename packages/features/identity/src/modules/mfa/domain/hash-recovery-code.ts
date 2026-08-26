import { hashOpaqueToken } from "@repo/api-core";

import { normalizeRecoveryCode } from "./recovery-codes";

export const hashRecoveryCode = (code: string): string =>
  hashOpaqueToken(normalizeRecoveryCode(code));
