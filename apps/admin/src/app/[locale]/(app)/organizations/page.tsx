import type { Metadata } from "next";
import { Suspense } from "react";

import { OrganizationsView } from "@/features/organizations";

export const metadata: Metadata = {
  title: "Organizations | Super Admin",
  description: "Manage tenant workspaces, organization members, and billing workspaces.",
};

export default function Page() {
  return (
    <Suspense>
      <OrganizationsView />
    </Suspense>
  );
}
