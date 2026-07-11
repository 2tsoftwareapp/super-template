import type { Metadata } from "next";

import { RolesView } from "@/features/roles/components/roles-view";

export const metadata: Metadata = {
  title: "Roles & Permissions | Super Admin",
  description:
    "Configure system roles, access policies, and permission levels.",
};

export default function Page() {
  return <RolesView />;
}
