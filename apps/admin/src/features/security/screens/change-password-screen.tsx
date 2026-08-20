"use client";

import { Shield } from "lucide-react";

import type { AdminResourceConfig } from "@/lib/admin-resources";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { useChangePasswordController } from "@/features/security/controllers/use-change-password-controller";

import { ChangePasswordForm } from "../ui/change-password-form";

const changePasswordResource: AdminResourceConfig = {
  id: "security-password",
  label: "Change password",
  group: "System",
  path: "/security/password",
  icon: Shield,
  features: ["edit"],
  queryKey: "admin-security-password",
};

/** Connects the forced password-change controller to its form. */
export function ChangePasswordScreen() {
  const password = useChangePasswordController();

  return (
    <ResourcePageShell
      resource={changePasswordResource}
      description="You must update your password before continuing."
    >
      <div className="mx-auto max-w-md space-y-8 py-12">
        <ChangePasswordForm
          onChangePassword={password.handleChangePassword}
          isSaving={password.isSaving}
        />
      </div>
    </ResourcePageShell>
  );
}
