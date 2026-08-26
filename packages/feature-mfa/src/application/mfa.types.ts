export interface MfaChallengeMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
}

export interface MfaConfirmCommand {
  userId: string;
  code: string;
}

export interface MfaDisableCommand {
  userId: string;
  code: string;
}

export interface MfaRegenerateRecoveryCodesCommand {
  userId: string;
  code: string;
}

export interface MfaCreateChallengeCommand {
  userId: string;
  metadata: MfaChallengeMetadata;
}

export interface MfaVerifyChallengeCommand {
  mfaToken: string;
  code: string;
  metadata: MfaChallengeMetadata;
}
