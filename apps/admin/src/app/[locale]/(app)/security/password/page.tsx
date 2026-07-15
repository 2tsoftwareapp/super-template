import type { Metadata } from "next";

import { ChangePasswordScreen } from "@/features/security/screens/change-password-screen";

export const metadata: Metadata = {
  title: "Change Password | Super Admin",
};

export default function ChangePasswordPage() {
  return <ChangePasswordScreen />;
}
