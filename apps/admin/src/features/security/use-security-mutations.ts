"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangePasswordFormValues } from "./security-schemas";

import { changePassword } from "./security-service";

export function useChangePasswordMutation(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: ChangePasswordFormValues) =>
      changePassword({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    onSuccess: () => {
      toast.success("Password updated successfully");
      options?.onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to change password. Check your current password.");
    },
  });
}
