import type { components, operations } from "@repo/api-contract";

import type { ChangePasswordFormValues } from "./security.schemas";

/** Password payload defined by the OpenAPI contract. */
export type ChangePasswordRequest = components["schemas"]["ChangePasswordDto"];

/** MFA status envelope defined by the OpenAPI operation. */
export type MfaStatusResponse =
  operations["MfaController_getStatus"]["responses"][200]["content"]["application/json"];

/** MFA setup envelope defined by the OpenAPI operation. */
export type MfaSetupResponse =
  operations["MfaController_setup"]["responses"][201]["content"]["application/json"];

/** MFA recovery-code envelope shared by confirm and regenerate operations. */
export type MfaRecoveryCodesResponse =
  operations["MfaController_confirm"]["responses"][201]["content"]["application/json"];

/** MFA disable envelope defined by the OpenAPI operation. */
export type MfaDisableResponse =
  operations["MfaController_disable"]["responses"][201]["content"]["application/json"];

/** Visible stage of the MFA management flow. */
export type MfaView = "idle" | "setup" | "recovery-codes";

/** Password-change state and actions exposed to security screens. */
export interface PasswordSecurityViewModel {
  handleChangePassword: (values: ChangePasswordFormValues) => Promise<void>;
  isSaving: boolean;
}

/** MFA state and actions exposed to the account-security screen. */
export interface MfaSecurityViewModel {
  status: {
    isLoading: boolean;
    isError: boolean;
    mfaEnabled: boolean;
    handleRetry: () => void;
  };
  view: MfaView;
  setupData: MfaSetupResponse["data"] | null;
  recoveryCodes: string[];
  otpCode: string;
  handleOtpChange: (code: string) => void;
  handleStartSetup: () => Promise<void>;
  handleVerifyOtp: (code: string) => Promise<void>;
  handleDisable: (code: string) => Promise<void>;
  handleRegenerate: (code: string) => Promise<void>;
  handleCancelSetup: () => void;
  handleRecoveryCodesDone: () => void;
  handleCopyRecoveryCodes: () => void;
  handleCopyRecoveryCodesError: () => void;
  isSettingUp: boolean;
  isVerifying: boolean;
  isDisabling: boolean;
  isRegenerating: boolean;
}

/** Complete view model for the account-security screen. */
export interface SecurityViewModel {
  password: PasswordSecurityViewModel;
  mfa: MfaSecurityViewModel;
}
