import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChangePasswordForm } from "../change-password-form";
import { MfaManagement } from "../mfa-management";
import { MfaRecoveryCodes } from "../mfa-recovery-codes";
import { MfaSetupFlow } from "../mfa-setup-flow";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (k: string) => k,
  }),
}));

describe("Security UI Components", () => {
  describe("ChangePasswordForm", () => {
    it("renders change password inputs and submits with valid data", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<ChangePasswordForm onChangePassword={onSubmit} isSaving={false} />);

      expect(screen.getByText("Change password")).toBeInTheDocument();
      expect(screen.getByLabelText("Current password")).toBeInTheDocument();
      expect(screen.getByLabelText("New password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Current password"), "OldPassword123!");
      await user.type(screen.getByLabelText("New password"), "NewPassword123!");
      await user.type(screen.getByLabelText("Confirm new password"), "NewPassword123!");

      await user.click(screen.getByRole("button", { name: /update password/i }));

      expect(onSubmit).toHaveBeenCalledWith({
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });
    });
  });

  describe("MfaSetupFlow", () => {
    it("renders QR code title, secret key, and OTP inputs", () => {
      render(
        <MfaSetupFlow
          setupData={{
            secret: "JBSWY3DPEHPK3PXP",
            otpauthUrl: "otpauth://totp/SuperAdmin:test@example.com?secret=JBSWY3DPEHPK3PXP",
          }}
          otpCode=""
          onOtpChange={vi.fn()}
          onVerify={vi.fn()}
          onCancel={vi.fn()}
          isVerifying={false}
        />,
      );

      expect(screen.getByText("Set up two-factor authentication")).toBeInTheDocument();
      expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
      expect(screen.getByText(/Scan QR Code or enter manual secret/i)).toBeInTheDocument();
    });
  });

  describe("MfaRecoveryCodes", () => {
    it("renders list of recovery codes and copy/download buttons", () => {
      const mockCodes = ["code-1111", "code-2222", "code-3333", "code-4444"];
      render(
        <MfaRecoveryCodes
          codes={mockCodes}
          onDone={vi.fn()}
          onCopy={vi.fn()}
          onCopyError={vi.fn()}
        />,
      );

      expect(screen.getByText("Two-Factor Recovery Codes")).toBeInTheDocument();
      expect(screen.getByText("code-1111")).toBeInTheDocument();
      expect(screen.getByText("code-2222")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /copy all codes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
    });
  });

  describe("MfaManagement", () => {
    it("renders enabled state with status badge", () => {
      render(
        <MfaManagement
          status="enabled"
          view="idle"
          setupData={null}
          recoveryCodes={[]}
          otpCode=""
          onOtpChange={vi.fn()}
          onStartSetup={vi.fn()}
          onVerifyOtp={vi.fn()}
          onDisable={vi.fn()}
          onRegenerate={vi.fn()}
          onCancelSetup={vi.fn()}
          onRecoveryCodesDone={vi.fn()}
          isSettingUp={false}
          isVerifying={false}
          isDisabling={false}
          isRegenerating={false}
          onCopyRecoveryCodes={vi.fn()}
          onCopyRecoveryCodesError={vi.fn()}
        />,
      );

      expect(screen.getByText("Two-factor authentication")).toBeInTheDocument();
      expect(screen.getByText("Enabled")).toBeInTheDocument();
    });

    it("renders disabled state with enable button", () => {
      render(
        <MfaManagement
          status="disabled"
          view="idle"
          setupData={null}
          recoveryCodes={[]}
          otpCode=""
          onOtpChange={vi.fn()}
          onStartSetup={vi.fn()}
          onVerifyOtp={vi.fn()}
          onDisable={vi.fn()}
          onRegenerate={vi.fn()}
          onCancelSetup={vi.fn()}
          onRecoveryCodesDone={vi.fn()}
          isSettingUp={false}
          isVerifying={false}
          isDisabling={false}
          isRegenerating={false}
          onCopyRecoveryCodes={vi.fn()}
          onCopyRecoveryCodesError={vi.fn()}
        />,
      );

      expect(screen.getByText("Two-factor authentication")).toBeInTheDocument();
      expect(screen.getByText("Disabled")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /enable two-factor authentication/i }),
      ).toBeInTheDocument();
    });
  });
});
