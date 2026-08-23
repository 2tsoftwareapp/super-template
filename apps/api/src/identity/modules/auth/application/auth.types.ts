export interface RegisterCommand {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface RefreshSessionCommand {
  refreshToken: string;
}

export interface ForgotPasswordCommand {
  email: string;
}

export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
}

export interface VerifyEmailCommand {
  token: string;
}

export interface ResendVerificationCommand {
  email: string;
}

export interface VerifyMfaChallengeCommand {
  mfaToken: string;
  code: string;
}
