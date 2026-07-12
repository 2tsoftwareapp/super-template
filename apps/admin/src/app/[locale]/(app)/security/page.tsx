import type { Metadata } from "next";

import { SecurityView } from "@/features/security/screens/security-view";

export const metadata: Metadata = {
  title: "Account Security & Preferences | Super Admin",
  description:
    "Configure password, security options, theme preferences, and locale.",
};

export default function SecurityPage() {
  return <SecurityView />;
}
