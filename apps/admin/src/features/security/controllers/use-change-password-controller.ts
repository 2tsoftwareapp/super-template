"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";

import type { ChangePasswordFormValues } from "../model/security.schemas";
import type { PasswordSecurityViewModel } from "../model/security.types";

import { useChangePasswordMutation } from "../api/security.mutations";

/**
 * Owns password-change orchestration and post-change navigation.
 *
 * The mutation clears identity-bound cache first; only then does the caller
 * redirect to login so no previous-user data can render during navigation.
 */
export function useChangePasswordController(): PasswordSecurityViewModel {
  const router = useRouter();
  const changePassword = useChangePasswordMutation();

  async function handleChangePassword(values: ChangePasswordFormValues) {
    try {
      await changePassword.mutateAsync(values);
      router.replace("/login");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not change your password."));
    }
  }

  return {
    handleChangePassword,
    isSaving: changePassword.isPending,
  };
}
