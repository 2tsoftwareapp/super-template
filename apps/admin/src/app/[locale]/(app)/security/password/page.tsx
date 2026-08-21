import type { Metadata } from "next";

import { ChangePasswordScreen } from "@/features/security";

export const metadata: Metadata = {
  title: "Change Password | Super Admin",
};

export default function ChangePasswordPage() {
  return <ChangePasswordScreen />;
}
