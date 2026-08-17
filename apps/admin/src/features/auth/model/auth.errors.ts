import { AUTH_FLOW_ERROR_CODES, AUTH_MESSAGES, type AuthFlowErrorCode } from "./auth.constants";

const authFlowMessages: Record<AuthFlowErrorCode, string> = {
  [AUTH_FLOW_ERROR_CODES.mfaRequired]: AUTH_MESSAGES.mfaRequired,
  [AUTH_FLOW_ERROR_CODES.missingMfaToken]: AUTH_MESSAGES.missingMfaToken,
  [AUTH_FLOW_ERROR_CODES.notAdmin]: AUTH_MESSAGES.adminOnly,
  [AUTH_FLOW_ERROR_CODES.ssoStartFailed]: AUTH_MESSAGES.ssoStartFailed,
};

export class AuthFlowError extends Error {
  constructor(
    public readonly code: AuthFlowErrorCode,
    public readonly metadata: { mfaToken?: string } = {},
  ) {
    super(authFlowMessages[code]);
    this.name = "AuthFlowError";
  }
}
